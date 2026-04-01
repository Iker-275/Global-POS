const Order = require("../models/orderModel");
const Customer = require("../models/customerModel");

const getDashboard = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    // -----------------------------
    // TOTAL CUSTOMERS
    // -----------------------------
    const totalCustomers = await Customer.countDocuments();

    // -----------------------------
    // TOTAL ORDERS
    // -----------------------------
    const totalOrders = await Order.countDocuments();

    // -----------------------------
    // GLOBAL TOTALS (ALL ORDERS)
    // -----------------------------
    const totalsAgg = await Order.aggregate([
      {
        $match: { status: { $ne: "cancelled" } }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$orderTotal" },
          totalPaid: { $sum: "$paidAmount" },
          totalUnpaid: { $sum: "$balance" }
        }
      }
    ]);

    const totals = totalsAgg[0] || {
      totalSales: 0,
      totalPaid: 0,
      totalUnpaid: 0
    };

    // -----------------------------
    // MONTHLY SALES (FOR CHARTS)
    // -----------------------------
    const monthlyAgg = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          year: String(year)
        }
      },
      {
        $group: {
          _id: "$month",
          totalSales: { $sum: "$orderTotal" },
          totalPaid: { $sum: "$paidAmount" },
          totalUnpaid: { $sum: "$balance" }
        }
      },
      {
        $sort: { _id: 1 } // sort months
      }
    ]);

    // -----------------------------
    // RECENT ORDERS (LAST 5)
    // -----------------------------
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // -----------------------------
    // NEW CUSTOMERS (LAST 5)
    // -----------------------------
    const newCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.json({
      success: true,

      summary: {
        totalOrders,
        totalCustomers,
        totalSales: totals.totalSales,
        totalPaid: totals.totalPaid,
        totalUnpaid: totals.totalUnpaid
      },

      monthly: monthlyAgg,

      recentOrders,
      newCustomers
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboard
};