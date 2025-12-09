const OrderStatus = require("../models/orderStatus");

// -----------------------------
// CREATE STATUS
// -----------------------------
const createStatus = async (req, res) => {
  try {
    const { name, visibility } = req.body;

    // Prevent duplicate names
    const exists = await OrderStatus.findOne({ name: name.toLowerCase() });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Status with this name already exists"
      });
    }

    const status = await OrderStatus.create({
      name: name.toLowerCase(),
      visibility
    });

    return res.json({
      success: true,
      message: "Order status created successfully",
      data: status
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------
// UPDATE STATUS
// -----------------------------
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await OrderStatus.findByIdAndUpdate(id, req.body, {
      new: true
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Status not found"
      });
    }

    return res.json({
      success: true,
      message: "Order status updated",
      data: updated
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------
// DELETE STATUS
// -----------------------------
const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await OrderStatus.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Status not found"
      });
    }

    return res.json({
      success: true,
      message: "Order status deleted successfully"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------
// LIST ALL STATUSES (with filters)
// -----------------------------
const getAllStatuses = async (req, res) => {
  try {
    const { visible } = req.query;

    let filter = {};
    if (visible === "true") filter.visibility = true;
    if (visible === "false") filter.visibility = false;

    const statuses = await OrderStatus.find(filter).sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: statuses
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -----------------------------
// GET STATUS BY ID
// -----------------------------
const getStatusById = async (req, res) => {
  try {
    const { id } = req.params;

    const status = await OrderStatus.findById(id);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: "Status not found"
      });
    }

    return res.json({
      success: true,
      data: status
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    const status = await OrderStatus.findById(id);
    if (!status) {
      return res.status(404).json({
        success: false,
        message: "Status not found"
      });
    }

    status.visibility = !status.visibility;
    await status.save();

    return res.json({
      success: true,
      message: "Visibility updated",
      data: status
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {getAllStatuses,getStatusById,createStatus,updateStatus,deleteStatus,toggleVisibility};