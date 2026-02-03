const Customer = require("../models/customerModel");

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

// ----------------------------------
// UPDATE CUSTOMER
// ----------------------------------
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
  updateCustomer
};
