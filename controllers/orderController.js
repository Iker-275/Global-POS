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


// utils/money.js
 const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

 const normalizeZero = (value) => {
  return Math.abs(value) < 0.005 ? 0 : value;
};


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



 const updateOrder2 = async (req, res) => {
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
    } 
    else if (paid === total) {
      paymentStatus = "paid";
      partially_paid = false;
      fully_paid = true;
      balance = 0;
    }
    
    else {
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

    const updateData = {
      ...req.body,
      paidAmount: paid,
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