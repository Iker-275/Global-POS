const DailyRecord = require("../models/dailyRecord.js");
const Order = require("../models/orderModel.js")
const moment = require("moment");


class DailyRecordService {

  // ---------------------------------------------------------
  // Get existing active daily record (started=true, closed=false)
  // ---------------------------------------------------------
  async getActiveRecord() {
    return await DailyRecord.findOne({ started: true, closed: false });
  }

  // ---------------------------------------------------------
  // Open Daily Record (Only if none is open for today)
  // ---------------------------------------------------------
  async openDailyRecord() {
    const today = moment().format("DD-MM-YYYY");

    // Check if already exists for today
    const existing = await DailyRecord.findOne({ date: today });

    if (existing && existing.closed === false) {
      return { alreadyOpen: true, record: existing };
    }

    // If exists but closed → reopen NOT allowed
    if (existing && existing.closed === true) {
      throw new Error("Daily record already closed for today.");
    }

    // Create new daily record
    const record = await DailyRecord.create({
      date: today,
      started: true,
      closed: false,
      weekOfYear: moment().week(),
      month: moment().format("MMMM"),
      year: moment().format("YYYY"),
      totalSales: 0,
      confirmedPayments: 0,
      pendingPayments: 0,
      orders: [],
    });

    return { created: true, record };
  }

  // ---------------------------------------------------------
  // Attach order to the daily record & update financials
  // ---------------------------------------------------------
  async attachOrderToRecord(order) {
    const record = await this.getActiveRecord();

    if (!record) {
      throw new Error("Cannot create order. Daily Record is not opened.");
    }

    if (record.closed) {
      throw new Error("Daily Record is closed. No more orders allowed.");
    }

    // Push order ID

    record.orderIds.push(order.orderId);
    // console.log("order id " + order.orderId);
    // console.log("order total" + order.orderId);



    // Add sales totals
    record.totalSales += order.orderTotal || 0;
    record.confirmedPayments += order.paidAmount || 0;
    record.pendingPayments += (order.orderTotal - order.paidAmount) || 0;
    // console.log("total sales " + record.totalSales);
    // console.log("confirmed " + record.confirmedPayments);
    // console.log("pending " + record.pendingPayments);


    await record.save();
    return record;
  }

  // ---------------------------------------------------------
  // Recalculate all totals for a daily record
  // ---------------------------------------------------------
async recalcTotalsForRecord(recordId) {
  const record = await DailyRecord.findById(recordId);
  if (!record) throw new Error("Daily record not found.");

  const orders = await Order.find({
    dailyRecordId: recordId,
    status: { $ne: "cancelled" }
  });

  let totalSales = 0;
  let confirmedPayments = 0;
  let pendingPayments = 0;

  for (const order of orders) {
    totalSales += order.orderTotal || 0;
    confirmedPayments += order.paidAmount || 0;
    pendingPayments += order.balance || 0;
  }

  record.totalSales = totalSales;
  record.confirmedPayments = confirmedPayments;
  record.pendingPayments = pendingPayments;

  await record.save();
  return record;
}

  // async recalcTotalsForRecord(recordId) {
  // //  console.log("1");

  //   const record = await DailyRecord.findById(recordId);
  //  // console.log(record);
    
  //   if (!record) throw new Error("Daily record not found.");
  //  // console.log("2");
  //  // console.log("record id: "+recordId);
  
  //   // Fetch all orders for this record
  //   const orders = await Order.find({ dailyRecordId: recordId });
  //  // console.log(orders);

  //  // console.log("3");

  //   let totalSales = 0;
  //   let confirmedPayments = 0;
  //   let pendingPayments = 0;
  //  // console.log("4");

  //   for (const order of orders) {
  //  // console.log("order"+order);

  //     totalSales += order.orderTotal || 0;
  //   //console.log("total sales"+totalSales);

  //     // If cancelled → skip from accounting
  //     if (order.status === "cancelled") continue;

  //     confirmedPayments += order.paidAmount || 0;
  //     pendingPayments += (order.orderTotal - order.paidAmount) || 0;
  //   }
  //  // console.log("5");

  //   record.totalSales = totalSales;
  //   record.confirmedPayments = confirmedPayments;
  //   record.pendingPayments = pendingPayments;
  //  // console.log("6");

  //   await record.save();
  //   return record;
  // }

  // ---------------------------------------------------------
  // Close Daily Record (finalize totals)
  // ---------------------------------------------------------
  async closeDailyRecord() {
    const record = await this.getActiveRecord();

    if (!record) {
      throw new Error("No active daily record to close.");
    }

    // Recalculate before closing
    await this.recalcTotalsForRecord(record._id);

    record.closed = true;
    await record.save();

    return record;
  }

  // ---------------------------------------------------------
  // Get daily record by id
  // ---------------------------------------------------------
  async getDailyRecordById(id) {
    return await DailyRecord.findById(id);
  }

  // ---------------------------------------------------------
  // List all daily records with pagination & filters
  // ---------------------------------------------------------
  async listDailyRecords({ page = 1, limit = 20, startDate, endDate }) {
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      DailyRecord.find(query).skip(skip).limit(limit).sort({ date: -1 }),
      DailyRecord.countDocuments(query)
    ]);

    return {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRecords: records.length,
      records
    };
  }
}

module.exports = new DailyRecordService();
