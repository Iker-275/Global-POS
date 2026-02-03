const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    active: {
      type: Boolean,
      default: true
    },
    userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "user",
  default: null
}
  },
  {
    timestamps: true
  }
);

// Helpful index for fast lookup (POS search by phone)
customerSchema.index({ phone: 1 });
customerSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: "objectId" } }
  }
);


module.exports = mongoose.model("Customer", customerSchema);
