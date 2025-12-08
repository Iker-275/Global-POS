import mongoose from "mongoose";

const OrderStatusSchema = new mongoose.Schema(
  {
    // _id: { type: String, required: true }, // pending, served, paid, etc.
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("OrderStatus", OrderStatusSchema);
