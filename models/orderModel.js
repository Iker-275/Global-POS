

const mongoose = require("mongoose");

const Counter = require("./counterModel")


const DishSchema = new mongoose.Schema({
  menuItem: { type: String, required: true },
  qty: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
  pricePerQty: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  totalAmount: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema(
  {
   
    orderId: {
      type: Number,
      required: true,
    },
     dailyRecordId: {
      type: String,
      ref: "DailyRecord",
      required: true,
    },

    dailyRecordDate: {
      type: String,
      ref: "DailyRecord",
      required: true,
    },

    user_id: { type: String, ref: "User", required: true },

    dishesOrdered: [DishSchema],

    orderTotal: { type: Number, required: true },

    fully_paid: { type: Boolean, default: false },
    partially_paid: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },

    status: {
      type: String,
      ref: "OrderStatus",
      default: "pending",
    },

    paymentStatus: { type: String, default: "unpaid" },

    customer_phone: { type: String, default: "" },
    customer_name: { type: String, default: "" },
    created_at: { type: String, default: "" },

    weekOfYear: Number,
    month: String,
    year: String,
  },
  { timestamps: true }
);

// ----------------- AUTO INCREMENT ORDER ID -----------------
OrderSchema.pre("validate", async function (next) {
  if (!this.isNew) return next;

  const counter = await Counter.findOneAndUpdate(
    { id: "orderId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  this.orderId = counter.seq;

  next;
});

// Useful indexes
OrderSchema.index({ dailyRecordId: 1 });
OrderSchema.index({ dailyRecordDate: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ user_id: 1 });

module.exports =  mongoose.model("Order", OrderSchema);
