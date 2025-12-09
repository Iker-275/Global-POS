// seedOrderStatuses.js
const mongoose = require("mongoose");
const OrderStatus = require("../models/orderStatus"); // adjust path if needed



const predefinedStatuses = [
  { name: "Pending", visibility: true },
  { name: "Served", visibility: true },
  { name: "Paid", visibility: true },
  { name: "Cancelled", visibility: true },
];

async function seedStatuses() {
  try {
    

    console.log(" Seeding Order Statuses...");

    for (const status of predefinedStatuses) {
      const exists = await OrderStatus.findOne({ name: status.name });

      if (exists) {
        console.log(`✔️ Status already exists → ${status.name}`);
      } else {
        await OrderStatus.create(status);
        console.log(`✅ Created Status → ${status.name}`);
      }
    }

    console.log("\n🎉 Order Status seeding completed!");
    process.exit();
  } catch (error) {
    console.error("❌ Error seeding order statuses:", error);
    process.exit(1);
  }
}



module.exports = {seedStatuses};