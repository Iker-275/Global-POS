// server.js
const app = require("./app");
const connectDB = require("./db/connect");

const PORT = process.env.PORT || 3000;
connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
});