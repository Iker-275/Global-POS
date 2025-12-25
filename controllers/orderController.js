// controllers/OrderController.js

const mongoose = require("mongoose");
const User = require("../models/userModel.js");
const OrderStatus = require("../models/orderStatus.js");
const Order = require ("../models/orderModel.js")
const dailyRecordService = require("../services/dailyRecordService.js")
const dayjs = require( "dayjs");
const weekOfYear = require( "dayjs/plugin/weekOfYear.js");


// =========================================
// CREATE ORDER
// =========================================


dayjs.extend(weekOfYear);

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

    // 2. Derive date fields (SOURCE OF TRUTH)
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

    // 3. Attach + recalc
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


//  const createOrder = async (req, res) => {

//   try {
//     const {
//       dailyRecordDate,
//       user_id,
//       dishesOrdered,
//       orderTotal, // required by model, but validate
//       customer_phone,
//       customer_name,
//       status = "pending",
//       balance: providedBalance,
//       created_at,
//     } = req.body;
    
//     // 1. Check active daily record
//     const dailyRecord = await dailyRecordService.getActiveRecord();
//     if (!dailyRecord) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot create order. Daily Record is not opened."
//       });
//     }
 
 
//     // 2. Create order
//     const order = await Order.create({
//        dailyRecordDate,
//       user_id,
//       dishesOrdered: dishesOrdered || [],
//       orderTotal,
//       status,
//       paymentStatus: "unpaid",
//       customer_phone: customer_phone || "",
//       customer_name: customer_name || "",
//       created_at: created_at || new Date().toISOString(),
//       dailyRecordId: dailyRecord._id
//     });


//     // 3. Attach to daily record
//     await dailyRecordService.attachOrderToRecord(order);
//     // 4. Recalculate totals after creation
//     console.log("record id :" +dailyRecord._id);
    
//     await dailyRecordService.recalcTotalsForRecord(dailyRecord._id);


//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       data: order
//     });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };


// =========================================
// UPDATE ORDER
// (Recalculate totals after update)
// =========================================


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

    // COMPUTE PAYMENT AFTER MERGING BODY
    const paid = req.body.paidAmount !== undefined
      ? Number(req.body.paidAmount)
      : existing.paidAmount;

    const total = existing.orderTotal;

    let paymentStatus = "unpaid";
    let partially_paid = false;
    let fully_paid = false;
    let balance = total;

    if (paid <= 0) {
      paymentStatus = "unpaid";
      partially_paid = false;
      fully_paid = false;
      balance = total;
    } else if (paid < total) {
      paymentStatus = "partial";
      partially_paid = true;
      fully_paid = false;
      balance = total - paid;
    } else {
      paymentStatus = "paid";
      partially_paid = false;
      fully_paid = true;
      balance = 0;
    }

    // MERGE REQ BODY WITH COMPUTED VALUES
    const updateData = {
      ...req.body,
      paymentStatus,
      partially_paid,
      fully_paid,
      balance
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






// =========================================
// CANCEL ORDER (if still pending)
// Should not affect balances
// =========================================
//  const cancelOrder = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const order = await Order.findOne({ orderId: id });

//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }

//     if (order.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: "Only pending orders can be cancelled."
//       });
//     }

//     order.status = "cancelled";
//     await order.save();

//     // Recalculate totals (will auto-ignore cancelled orders)
//     //await dailyRecordService.recalcTotalsForRecord(order.dailyRecordId);

//     return res.json({
//       success: true,
//       message: "Order cancelled successfully",
//       data: order
//     });

//   } catch (error) {
//     console.log("error"+ error)
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

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


// =========================================
// DELETE ORDER (remove & recalc)
// =========================================
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


// =========================================
// GET ORDERS (pagination + filters)
// status, date, customer, user
// =========================================
//  const getOrders = async (req, res) => {
//   try {
//     let { page = 1, limit = 20, status, date, customer } = req.query;

//     page = parseInt(page);
//     limit = parseInt(limit);

//     const query = {};

//     if (status) query.status = status;
//     if (customer) query.customer = customer;
//     if (date) query.dailyRecordDate = date;//  format (DD-MM-YYYY)

//     const skip = (page - 1) * limit;

//     const [orders, total] = await Promise.all([
//       Order.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
//       Order.countDocuments(query)
//     ]);

//     return res.json({
//       success: true,
//       page,
//       limit,
//       totalPages: Math.ceil(total / limit),
//       totalOrders: orders.length,
//       data: orders
//     });

//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
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
      month,         // "June" or 6
      year,          // 2025
      week           // 35
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (status) query.status = status;
    if (customer) query.customer_name = customer;
    if (date) query.dailyRecordDate = date;

    // ------------------------------------
    // DAILY RECORD FILTERING
    // ------------------------------------
    let dailyRecordIds = null;

    if (month || year || week) {
      const recordQuery = {};

      if (year) recordQuery.year = Number(year);
      if (week) recordQuery.weekOfYear = Number(week);

      if (month) {
        recordQuery.month =
          isNaN(month) ? month : new Date(2025, month - 1).toLocaleString("en", { month: "long" });
      }

      const records = await DailyRecord.find(recordQuery).select("_id");

      dailyRecordIds = records.map(r => r._id);
      query.dailyRecordId = { $in: dailyRecordIds };
    }

    // ------------------------------------
    // DATE RANGE FILTER (Orders)
    // ------------------------------------
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Order.countDocuments(query)
    ]);

    // ------------------------------------
    // TOTALS CALCULATION
    // ------------------------------------
    let totals = {
      totalSales: 0,
      confirmedPayments: 0,
      pendingPayments: 0,
      orderIds: []
    };

    // 🟢 Single-day shortcut
    if (date) {
      const record = await DailyRecord.findOne({ date });

      if (record) {
        totals = {
          totalSales: record.totalSales,
          confirmedPayments: record.confirmedPayments,
          pendingPayments: record.pendingPayments,
          orderIds: record.orderIds
        };
      }
    } 
    // 🔁 Aggregate filtered orders
    else {
      for (const order of orders) {
        if (order.status === "cancelled") continue;

        totals.totalSales += order.orderTotal || 0;
        totals.confirmedPayments += order.paidAmount || 0;
        totals.pendingPayments += order.balance || 0;
        totals.orderIds.push(order.orderId);
      }
    }

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


// =========================================
// GET ORDER BY ID
// =========================================
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


module.exports = { cancelOrder,getOrderById,getOrdersByDate,getOrders,deleteOrder,updateOrder,createOrder}