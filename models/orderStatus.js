const mongoose = require("mongoose");

const OrderStatusSchema = new mongoose.Schema(
  {
    // _id: { type: String, required: true }, // pending, served, paid, etc.
    name: { type: String, required: true },
    visibility: { type: Boolean, required: true, default: true }

  },
  { timestamps: true }
);

module.exports =  mongoose.model("OrderStatus", OrderStatusSchema);
