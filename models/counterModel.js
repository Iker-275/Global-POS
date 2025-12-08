const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
  id: { type: String },
  seq: { type: Number },
});

module.exports =  mongoose.model("Counter", CounterSchema);