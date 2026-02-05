const Customer = require("../models/customerModel");
const User = require("../models/userModel");
const OrderStatus = require("../models/orderStatus.js");
const Order = require ("../models/orderModel.js")

// ----------------------------------
// CREATE CUSTOMER
// ----------------------------------
const createCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required"
      });
    }

    // Prevent duplicate phone
    const existing = await Customer.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Customer with this phone already exists",
        data: existing
      });
    }

    const customer = await Customer.create({ name, phone });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------
// GET CUSTOMER BY ID
// ----------------------------------
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    return res.json({
      success: true,
      data: customer
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ----------------------------------
// GET CUSTOMERS (SEARCH BY NAME / PHONE)
// ----------------------------------
const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .limit(50); // POS-safe default

    return res.json({
      success: true,
      count: customers.length,
      data: customers
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllCustomerBalances = async (req, res) => {
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
      week,
      onlyUnpaid
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    // -----------------------------
    // BASIC FILTERS
    // -----------------------------
    if (customer) query.customer_name = customer;

    if (status) query.status = status;

    // Only unpaid / partial orders
    if (onlyUnpaid === "true") {
      query.paymentStatus = { $ne: "paid" };
    }

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
    // GLOBAL TOTALS (NO PAGINATION)
    // -----------------------------
    const allOrders = await Order.find(query).lean();

    const totals = allOrders.reduce(
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

    // -----------------------------
    // PAGINATED ORDERS (LIGHT)
    // -----------------------------
    const skip = (page - 1) * limit;

    const projection = {
      dishesOrdered: 0,
      weekOfYear: 0,
      month: 0,
      year: 0,
      updatedAt: 0
    };

    const orders = await Order.find(query, projection)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      filters: {
        onlyUnpaid: onlyUnpaid === "true"
      },
      page,
      limit,
      totalPages: Math.ceil(allOrders.length / limit),
      totalOrders: allOrders.length,
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





// ----------------------------------
// UPDATE CUSTOMER
// ----------------------------------
// const updateCustomer = async (req, res) => {
//   try {
//     const { name, phone, active } = req.body;

//     // Prevent phone duplication
//     if (phone) {
//       const existing = await Customer.findOne({
//         phone,
//         _id: { $ne: req.params.id }
//       });

//       if (existing) {
//         return res.status(400).json({
//           success: false,
//           message: "Another customer already uses this phone number"
//         });
//       }
//     }

//     const customer = await Customer.findByIdAndUpdate(
//       req.params.id,
//       { name, phone, active },
//       { new: true }
//     );

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found"
//       });
//     }

//     return res.json({
//       success: true,
//       message: "Customer updated successfully",
//       data: customer
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


const updateCustomer = async (req, res) => {
  try {
    const { name, phone, active } = req.body;

    // Prevent phone duplication
    if (phone) {
      const existing = await Customer.findOne({
        phone,
        _id: { $ne: req.params.id }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Another customer already uses this phone number"
        });
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, active },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // 🔄 Sync user active status if linked
    if (typeof active === "boolean" && customer.userId) {
      await User.findByIdAndUpdate(customer.userId, {
        active
      });
    }

    return res.json({
      success: true,
      message: "Customer updated successfully",
      data: customer
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




module.exports = {
  createCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
 

};
