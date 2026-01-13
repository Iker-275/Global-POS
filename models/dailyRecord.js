const mongoose = require("mongoose");

const DailyRecordSchema = new mongoose.Schema(
    {
        // _id: {
        //     type: String, // date string e.g. "05-06-2025"
        //     required: true,
        // },

        date: { type: String, required: true },

        started: { type: Boolean, default: false },
        isOpen: { type: Boolean, default: false },
        time_started: { type: String, default: "" },

        closed: { type: Boolean, default: false },
        time_closed: { type: String, default: "" },

        start_user_id: { type: String, ref: "User" },
        close_user_id: { type: String, ref: "User" },

        starting_balance: { type: Number, default: 0 },
        closing_balance: { type: Number, default: 0 },

        weekOfYear: Number,
        month: String,
        year: String,

        totalSales: { type: Number, default: 0 },
        confirmedPayments: { type: Number, default: 0 },
        pendingPayments: { type: Number, default: 0 },

        orderIds: [
            {
                type: Number,
                ref: "Order",
            },
        ],
        reopenedBy: {
            type: String, // userId
            ref: "User",
            default: null
        },

        reopenedAt: {
            type: Date,
            default: null
        },

        reopenReason: {
            type: String,
            default: ""
        }

    },
    { timestamps: true }
);

module.exports = mongoose.model("DailyRecord", DailyRecordSchema);
