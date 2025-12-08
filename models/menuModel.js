
const mongoose = require("mongoose")

const MenuSchema = new mongoose.Schema(
  {
    menuItem: { type: String, required: true },
    pricePerQty: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    availableToday: { type: Boolean, default: true },

    // Optional enhancements
    category: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    bestSeller: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", MenuSchema);
