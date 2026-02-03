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
    userId:{
        unique:true,
        require:false,
        type:String,
        default:""
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for fast lookup (POS search by phone)
customerSchema.index({ phone: 1 });

module.exports = mongoose.model("Customer", customerSchema);
