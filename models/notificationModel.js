const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "CUSTOMER_CREATED",
        "CUSTOMER_UPDATED",
        "CUSTOMER_DELETED",
        "ADMIN_NOTIFICATION"


      ],
      required: true
    },

    message: { type: String, required: true },

    targetRoles: [String],
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    relatedEntity: {
      entityType: String,
      entityId: mongoose.Schema.Types.ObjectId
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }],

   // isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);



const Notification= mongoose.model('Notification', notificationSchema);
module.exports = Notification;