// controllers/OrderController.js

const mongoose = require("mongoose");
const User = require("../models/userModel.js");
const OrderStatus = require("../models/orderStatus.js");
const Order = require ("../models/orderModel.js")
const dailyRecordService = require("../services/dailyRecordService.js")
const dayjs = require( "dayjs");
const weekOfYear = require( "dayjs/plugin/weekOfYear.js");
const customerService = require("../services/customerService.js");



// =========================================
// CREATE ORDER
// =========================================


dayjs.extend(weekOfYear);


// utils/money.js
 const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

 const normalizeZero = (value) => {
  return Math.abs(value) < 0.005 ? 0 : value;
};


// const createOrder = async (req, res) => {
//   try {
//     const {
//       dishesOrdered,
//       orderTotal,
//       customer_phone,
//       customer_name,
//       status = "pending",
//       created_at
//     } = req.body;

//     // 1. Check active daily record
//     const dailyRecord = await dailyRecordService.getActiveRecord();

//     if (!dailyRecord) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot create order. Daily Record is not opened."
//       });
//     }

//     if (dailyRecord.closed) {
//       return res.status(400).json({
//         success: false,
//         message: "Daily Record is closed. No orders allowed."
//       });
//     }

//     // 2. Derive date fields (SOURCE OF TRUTH)
//     const recordDate = dayjs(dailyRecord.date, "DD-MM-YYYY");

//     const order = await Order.create({
//       dailyRecordId: dailyRecord._id,
//       dailyRecordDate: dailyRecord.date,

//       weekOfYear: dailyRecord.weekOfYear ?? recordDate.week(),
//       month: dailyRecord.month ?? recordDate.format("MMMM"),
//       year: dailyRecord.year ?? recordDate.format("YYYY"),

//       user_id: req.user?.id || req.body.user_id,

//       dishesOrdered: dishesOrdered || [],
//       orderTotal,

//       status,
//       paymentStatus: "unpaid",
//       paidAmount: 0,
//       balance: orderTotal,

//       customer_phone: customer_phone || "",
//       customer_name: customer_name || "",

//       created_at: created_at || new Date().toISOString()
//     });

//     // 3. Attach + recalc
//     await dailyRecordService.attachOrderToRecord(order);
//     await dailyRecordService.recalcTotalsForRecord(dailyRecord._id);

//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       data: order
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


const createOrder = async (req, res) => {
  try {
    const {
      dishesOrdered,
      orderTotal,
      customer_phone,
      customer_name,
      status = "pending",
      created_at
    } = req.body;

    // 1. Check active daily record
    const dailyRecord = await dailyRecordService.getActiveRecord();

    if (!dailyRecord) {
      return res.status(400).json({
        success: false,
        message: "Cannot create order. Daily Record is not opened."
      });
    }

    if (dailyRecord.closed) {
      return res.status(400).json({
        success: false,
        message: "Daily Record is closed. No orders allowed."
      });
    }

    // 2. Silently handle customer (NON-BLOCKING)
    if (customer_phone && customer_phone.trim()) {
      try {
        await customerService.findOrCreateCustomerByPhone({
          phone: customer_phone.trim(),
          name: customer_name
        });
      } catch (err) {
        // POS rule: customer failure should NEVER block an order
        console.error("Customer creation skipped:", err.message);
      }
    }

    // 3. Derive date fields
    const recordDate = dayjs(dailyRecord.date, "DD-MM-YYYY");

    const order = await Order.create({
      dailyRecordId: dailyRecord._id,
      dailyRecordDate: dailyRecord.date,

      weekOfYear: dailyRecord.weekOfYear ?? recordDate.week(),
      month: dailyRecord.month ?? recordDate.format("MMMM"),
      year: dailyRecord.year ?? recordDate.format("YYYY"),

      user_id: req.user?.id || req.body.user_id,

      dishesOrdered: dishesOrdered || [],
      orderTotal,

      status,
      paymentStatus: "unpaid",
      paidAmount: 0,
      balance: orderTotal,

      customer_phone: customer_phone || "",
      customer_name: customer_name || "",

      created_at: created_at || new Date().toISOString()
    });

    // 4. Attach + recalc
    await dailyRecordService.attachOrderToRecord(order);
    await dailyRecordService.recalcTotalsForRecord(dailyRecord._id);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};







const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await Order.findOne({ orderId: id });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const paid = req.body.paidAmount !== undefined
      ? roundMoney(req.body.paidAmount)
      : roundMoney(existing.paidAmount);

    const total = roundMoney(existing.orderTotal);

    let paymentStatus = "unpaid";
    let partially_paid = false;
    let fully_paid = false;
    let balance = total;

    if (paid <= 0) {
      balance = total;
    } 
    else if (paid < total) {
      paymentStatus = "partial";
      partially_paid = true;
      balance = roundMoney(total - paid);
    } 
    else {
      paymentStatus = "paid";
      fully_paid = true;
      balance = 0;
    }

    balance = normalizeZero(balance);

     let status = req.body.status || existing.status;
    if (paymentStatus === "paid") {
      status = "paid"; // automatically mark order as paid
    }

    const updateData = {
      ...req.body,
      paidAmount: paid,
      paymentStatus,
      partially_paid,
      fully_paid,
      balance,
      status
    };

    const updated = await Order.findOneAndUpdate(
      { orderId: id },
      updateData,
      { new: true }
    );

    await dailyRecordService.recalcTotalsForRecord(existing.dailyRecordId);

    return res.json({
      success: true,
      message: "Order updated successfully",
      data: updated
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const bulkPayOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of orderIds to update"
      });
    }

    // Fetch all orders
    const orders = await Order.find({ orderId: { $in: orderIds } });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for the provided orderIds"
      });
    }

    // Keep track of daily records affected
    const dailyRecordIds = new Set();

    // Update each order
    const bulkUpdates = orders.map(order => {
      dailyRecordIds.add(order.dailyRecordId.toString());

      return {
        updateOne: {
          filter: { orderId: order.orderId },
          update: {
            paymentStatus: "paid",
            status: "paid",
            fully_paid: true,
            partially_paid: false,
            balance: 0,
            paidAmount: order.orderTotal
          }
        }
      };
    });

    // Apply bulk updates
    await Order.bulkWrite(bulkUpdates);

    // Recalculate totals for affected daily records
    for (const drId of dailyRecordIds) {
      await dailyRecordService.recalcTotalsForRecord(drId);
    }

    return res.json({
      success: true,
      message: `${orders.length} orders updated to paid successfully`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled."
      });
    }

    order.status = "cancelled";
    await order.save();

    await dailyRecordService.recalcTotalsForRecord(order.dailyRecordId);

    return res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


 const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const dailyRecordId = order.dailyRecordId;

    await order.deleteOne();

    // Recalculate totals after deletion
    await dailyRecordService.recalcTotalsForRecord(dailyRecordId);

    return res.json({
      success: true,
      message: "Order deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



const getOrders = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      status,
      customer,
      date,          // DD-MM-YYYY
      startDate,     // ISO or YYYY-MM-DD
      endDate,       // ISO or YYYY-MM-DD
      month,         // 1 - 12 OR "June"
      year,          // 2025
      week           // 35
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // ------------------------------------
    // BASIC FILTERS
    // ------------------------------------
    if (status) query.status = status;
    if (customer) query.customer_name = customer;

    // ------------------------------------
    // DATE FILTERS (Orders only)
    // ------------------------------------
    if (date) {
      // DD-MM-YYYY → range for that day
      const [day, month, year] = date.split("-");
      const start = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
      const end = new Date(`${year}-${month}-${day}T23:59:59.999Z`);

      query.createdAt = { $gte: start, $lte: end };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (year) {
      query.createdAt = {
        ...query.createdAt,
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    if (month) {
      const monthIndex = isNaN(month)
        ? new Date(`${month} 1, ${year || new Date().getFullYear()}`).getMonth()
        : Number(month) - 1;

      const y = year || new Date().getFullYear();

      query.createdAt = {
        $gte: new Date(y, monthIndex, 1),
        $lte: new Date(y, monthIndex + 1, 0, 23, 59, 59)
      };
    }

    if (week && year) {
      const firstDayOfYear = new Date(year, 0, 1);
      const startOfWeek = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + (week - 1) * 7));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      query.createdAt = {
        $gte: startOfWeek,
        $lte: endOfWeek
      };
    }

    // ------------------------------------
    // PAGINATION
    // ------------------------------------
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments(query)
    ]);

    // ------------------------------------
    // TOTALS (FROM FILTERED ORDERS)
    // ------------------------------------
    const totals = orders.reduce(
      (acc, order) => {
        if (order.status === "cancelled") return acc;

        acc.totalSales += order.orderTotal || 0;
        acc.confirmedPayments += order.paidAmount || 0;
        acc.pendingPayments += order.balance || 0;
        acc.orderIds.push(order.orderId);

        return acc;
      },
      {
        totalSales: 0,
        confirmedPayments: 0,
        pendingPayments: 0,
        orderIds: []
      }
    );

    return res.json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      totals,
      data: orders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getCustomerOrdersWithBalance = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      phone,            // REQUIRED: customer phone
      status,           // optional order status
      onlyUnpaid,       // true / false
      date,
      startDate,
      endDate,
      month,
      year,
      week
    } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Customer phone number is required"
      });
    }

    page = parseInt(page);
    limit = parseInt(limit);

    // ------------------------------------
    // BASE QUERY (CUSTOMER-SCOPED)
    // ------------------------------------
    const query = {
      customer_phone: phone
    };

    if (status) {
      query.status = status;
    }

    if (onlyUnpaid === "true") {
      query.paymentStatus = { $ne: "paid" };
    }

    // ------------------------------------
    // DATE FILTERS
    // ------------------------------------
    if (date) {
      const [day, month, year] = date.split("-");
      query.createdAt = {
        $gte: new Date(`${year}-${month}-${day}T00:00:00.000Z`),
        $lte: new Date(`${year}-${month}-${day}T23:59:59.999Z`)
      };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (year) {
      query.createdAt = {
        ...query.createdAt,
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    if (month) {
      const monthIndex = isNaN(month)
        ? new Date(`${month} 1, ${year || new Date().getFullYear()}`).getMonth()
        : Number(month) - 1;

      const y = year || new Date().getFullYear();

      query.createdAt = {
        $gte: new Date(y, monthIndex, 1),
        $lte: new Date(y, monthIndex + 1, 0, 23, 59, 59)
      };
    }

    if (week && year) {
      const firstDayOfYear = new Date(year, 0, 1);
      const startOfWeek = new Date(
        firstDayOfYear.setDate(firstDayOfYear.getDate() + (week - 1) * 7)
      );
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      query.createdAt = {
        $gte: startOfWeek,
        $lte: endOfWeek
      };
    }

    // ------------------------------------
    // GLOBAL BALANCES (NO PAGINATION)
    // ------------------------------------
    const allCustomerOrders = await Order.find(query).lean();

    const totals = allCustomerOrders.reduce(
      (acc, order) => {
        if (order.status === "cancelled") return acc;

        acc.totalSales += order.orderTotal || 0;
        acc.totalPaid += order.paidAmount || 0;
        acc.totalBalance += order.balance || 0;
        acc.totalOrders++;

        return acc;
      },
      {
        totalSales: 0,
        totalPaid: 0,
        totalBalance: 0,
        totalOrders: 0
      }
    );

    // ------------------------------------
    // PAGINATED ORDERS
    // ------------------------------------
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments(query)
    ]);

    return res.json({
      success: true,
      customer: {
        phone
      },
      filters: {
        onlyUnpaid: onlyUnpaid === "true"
      },
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      totals, // 👈 GLOBAL, NOT PAGINATED
      data: orders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



const getOrdersHome = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      status,
      customer,
      date,
      startDate,
      endDate,
      month,
      year,
      week
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // -----------------------------
    // BASIC FILTERS
    // -----------------------------
    if (status) query.status = status;
    if (customer) query.customer_name = customer;
    if (customer) query.customer_phone = customer;


    // -----------------------------
    // DATE FILTERS
    // -----------------------------
    if (date) {
      const [day, month, year] = date.split("-");
      query.createdAt = {
        $gte: new Date(`${year}-${month}-${day}T00:00:00.000Z`),
        $lte: new Date(`${year}-${month}-${day}T23:59:59.999Z`)
      };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (year) {
      query.createdAt = {
        ...query.createdAt,
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    if (month) {
      const monthIndex = isNaN(month)
        ? new Date(`${month} 1, ${year || new Date().getFullYear()}`).getMonth()
        : Number(month) - 1;

      const y = year || new Date().getFullYear();

      query.createdAt = {
        $gte: new Date(y, monthIndex, 1),
        $lte: new Date(y, monthIndex + 1, 0, 23, 59, 59)
      };
    }

    if (week && year) {
      const firstDay = new Date(year, 0, 1);
      const startOfWeek = new Date(firstDay.setDate(firstDay.getDate() + (week - 1) * 7));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      query.createdAt = {
        $gte: startOfWeek,
        $lte: endOfWeek
      };
    }

    // -----------------------------
    // PAGINATION
    // -----------------------------
    const skip = (page - 1) * limit;

    // -----------------------------
    // FIELD PROJECTION (LIGHT RESPONSE)
    // -----------------------------
    const projection = {
      dishesOrdered: 0,
      weekOfYear: 0,
      month: 0,
      year: 0,
      createdAt: 0,
      updatedAt: 0,
      __v: 0
    };

    const [orders, totalOrders] = await Promise.all([
      Order.find(query, projection)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(), // faster & lighter
      Order.countDocuments(query)
    ]);

    return res.json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      data: orders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// const getOrdersReport = async (req, res) => {
//   try {
//     let {
//       page = 1,
//       limit = 20,
//       status,
//       customer,
//       date,
//       startDate,
//       endDate,
//       month,
//       year,
//       week
//     } = req.query;

//     page = parseInt(page);
//     limit = parseInt(limit);

//     const query = {};

//     // -----------------------------
//     // BASIC FILTERS
//     // -----------------------------
//     if (status) query.status = status;
//     if (customer) query.customer_name = customer;

//     // -----------------------------
//     // DATE FILTERS
//     // -----------------------------
//     if (date) {
//       const [day, month, year] = date.split("-");
//       query.createdAt = {
//         $gte: new Date(`${year}-${month}-${day}T00:00:00.000Z`),
//         $lte: new Date(`${year}-${month}-${day}T23:59:59.999Z`)
//       };
//     }

//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) query.createdAt.$gte = new Date(startDate);
//       if (endDate) query.createdAt.$lte = new Date(endDate);
//     }

//     if (year) {
//       query.createdAt = {
//         ...query.createdAt,
//         $gte: new Date(`${year}-01-01`),
//         $lte: new Date(`${year}-12-31`)
//       };
//     }

//     if (month) {
//       const monthIndex = isNaN(month)
//         ? new Date(`${month} 1, ${year || new Date().getFullYear()}`).getMonth()
//         : Number(month) - 1;

//       const y = year || new Date().getFullYear();

//       query.createdAt = {
//         $gte: new Date(y, monthIndex, 1),
//         $lte: new Date(y, monthIndex + 1, 0, 23, 59, 59)
//       };
//     }

//     if (week && year) {
//       const firstDay = new Date(year, 0, 1);
//       const startOfWeek = new Date(firstDay.setDate(firstDay.getDate() + (week - 1) * 7));
//       const endOfWeek = new Date(startOfWeek);
//       endOfWeek.setDate(endOfWeek.getDate() + 6);

//       query.createdAt = {
//         $gte: startOfWeek,
//         $lte: endOfWeek
//       };
//     }

//     // -----------------------------
//     // PAGINATION
//     // -----------------------------
//     const skip = (page - 1) * limit;

//     // -----------------------------
//     // FIELD PROJECTION (LIGHT RESPONSE)
//     // -----------------------------
//     const projection = {
//       dishesOrdered: 0,
//       weekOfYear: 0,
//       month: 0,
//       year: 0,
//       createdAt: 0,
//      // updatedAt: 0,
//     //  __v: 0
//     };

//     const [orders, totalOrders] = await Promise.all([
//       Order.find(query, projection)
//         .skip(skip)
//         .limit(limit)
//         .sort({ createdAt: -1 })
//         .lean(), // faster & lighter
//       Order.countDocuments(query)
//     ]);

//      // ------------------------------------
//     // TOTALS (FROM FILTERED ORDERS)
//     // ------------------------------------
//     const totals = orders.reduce(
//       (acc, order) => {
//         if (order.status === "cancelled") return acc;

//         acc.totalSales += order.orderTotal || 0;
//         acc.confirmedPayments += order.paidAmount || 0;
//         acc.pendingPayments += order.balance || 0;
//         acc.orderIds.push(order.orderId);

//         return acc;
//       },
//       {
//         totalSales: 0,
//         confirmedPayments: 0,
//         pendingPayments: 0,
//         orderIds: []
//       }
//     );

//     return res.json({
//       success: true,
//       page,
//       limit,
//       totalPages: Math.ceil(totalOrders / limit),
//       totals,
//       totalOrders,
//       data: orders
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };





// =========================================
// GET ORDER BY ID
// =========================================
 
const getOrdersReport = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 20,
      status,
      customer,
      date,
      startDate,
      endDate,
      month,
      year,
      week
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // -----------------------------
    // BASIC FILTERS
    // -----------------------------
    if (status) query.status = status;
    if (customer) query.customer_name = customer;

    // -----------------------------
    // DATE FILTERS
    // -----------------------------
    if (date) {
      const [day, month, year] = date.split("-");
      query.createdAt = {
        $gte: new Date(`${year}-${month}-${day}T00:00:00.000Z`),
        $lte: new Date(`${year}-${month}-${day}T23:59:59.999Z`)
      };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (year) {
      query.createdAt = {
        ...query.createdAt,
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
      };
    }

    if (month) {
      const monthIndex = isNaN(month)
        ? new Date(`${month} 1, ${year || new Date().getFullYear()}`).getMonth()
        : Number(month) - 1;

      const y = year || new Date().getFullYear();

      query.createdAt = {
        $gte: new Date(y, monthIndex, 1),
        $lte: new Date(y, monthIndex + 1, 0, 23, 59, 59)
      };
    }

    if (week && year) {
      const firstDay = new Date(year, 0, 1);
      const startOfWeek = new Date(firstDay.setDate(firstDay.getDate() + (week - 1) * 7));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      query.createdAt = {
        $gte: startOfWeek,
        $lte: endOfWeek
      };
    }

    // -----------------------------
    // CALCULATE TOTALS ACROSS ALL FILTERED ORDERS
    // -----------------------------
    const allFilteredOrders = await Order.find(query).lean();
    const totals = allFilteredOrders.reduce(
      (acc, order) => {
        if (order.status === "cancelled") return acc;
        acc.totalSales += order.orderTotal || 0;
        acc.confirmedPayments += order.paidAmount || 0;
        acc.pendingPayments += order.balance || 0;
        acc.orderIds.push(order.orderId);
        return acc;
      },
      {
        totalSales: 0,
        confirmedPayments: 0,
        pendingPayments: 0,
        orderIds: []
      }
    );

    // -----------------------------
    // PAGINATED DATA
    // -----------------------------
    const skip = (page - 1) * limit;
    const projection = {
      dishesOrdered: 0,
      weekOfYear: 0,
      month: 0,
      year: 0,
      createdAt: 0,
      updatedAt: 0
    };

    const paginatedOrders = await Order.find(query, projection)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(allFilteredOrders.length / limit),
      totalOrders: allFilteredOrders.length,
      totals,
      data: paginatedOrders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, data: order });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// =========================================
// GET ORDERS BY DATE
// =========================================
 const getOrdersByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const orders = await Order.find({dailyRecordDate: date });

    return res.json({
      success: true,
      count: orders.length,
      date,
      data: orders
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = { cancelOrder,getOrderById,getOrdersByDate,getOrders,deleteOrder,updateOrder,createOrder,getOrdersHome,getOrdersReport,bulkPayOrders,getCustomerOrdersWithBalance };