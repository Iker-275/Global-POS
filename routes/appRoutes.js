const { Router } = require("express");
const { login_get, signUp_get, signUp_post, login_post, logout_get } = require("../controllers/auth_controller");
const {
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItems,
} = require("../controllers/menuController");
const auth = require("../middleware/authMiddleware")
const allowRoles = require("../middleware/roleMiddleware")
const {createOrder,updateOrder,deleteOrder,getOrders,getOrderById,getOrdersByDate, cancelOrder} = require("../controllers/orderController")
const {openDailyRecord,closeDailyRecord, getActiveDailyRecord,} = require("../controllers/recordController");
const { getDailyRecordById, listDailyRecords } = require("../services/dailyRecordService");
const { createStatus, updateStatus, deleteStatus, getAllStatuses, getStatusById, toggleVisibility } = require("../controllers/statusController")

const router = Router();

//auth routes
router.get("/signup", signUp_get);
router.post("/signup", signUp_post);
router.get("/login", login_get);
router.post("/login", login_post);
router.get("/logout", logout_get);

//menu routes

router.post("/menu/add", addMenuItem);
router.put("/menu/update/:id", updateMenuItem);
router.delete("/menu/delete/:id", deleteMenuItem);
router.get("/menu", getMenuItems);

//order routes
router.post(
  "/order/add",
   // auth,
   // allowRoles("admin", "cashier", "manager"),
    createOrder
);

// UPDATE ORDER
router.put(
    "/order/:id",
  //  auth,
   // allowRoles("admin", "cashier", "manager"),
    updateOrder
);

// DELETE ORDER
router.delete(
    "/order/:id",
  //  auth,
   // allowRoles("admin"),
    deleteOrder
);

// GET ALL ORDERS WITH FILTERS + PAGINATION
router.get(
    "/order",
   // auth,
   // allowRoles("admin", "cashier", "manager"),
    getOrders
);

// GET SINGLE ORDER BY ID
router.get(
    "/order/:id",
   // auth,
   // allowRoles("admin", "cashier", "manager"),
    getOrderById
);

router.post(
    "/order/cancel/:id",
   // auth,
   // allowRoles("admin", "cashier", "manager"),
    cancelOrder
);
// GET ORDERS OF A SPECIFIC DATE
router.get(
    "/order/date/:date",
   // auth,
   // allowRoles("admin", "cashier", "manager"),
    getOrdersByDate
);

//records
// Create/open daily record
router.post(
  "/sales/open",
//   auth,
//   allowRoles("admin", "manager"),
  openDailyRecord
);

// Close daily record
router.post(
  "/sales/close",
//   auth,
//   allowRoles("admin", "manager"),
  closeDailyRecord
);

// Get today’s DR
router.get(
  "/sales/today",
//   auth,
//   allowRoles("admin", "manager", "cashier"),
  getActiveDailyRecord
);


router.get(
  "/sales/all",
//   auth,
//   allowRoles("admin", "manager", "cashier"),
  listDailyRecords
);
// Get DR by id
router.get(
  "/sales/:id",
//   auth,
//   allowRoles("admin", "manager", "cashier"),
  getDailyRecordById
);

// Create a new order status
router.post("/status", createStatus);

// Update an order status
router.put("/status/:id", updateStatus);

// toggle visibility
router.put("/status/toggle/:id", toggleVisibility);

// Delete an order status
router.delete("/status/:id", deleteStatus);

// Get all order statuses
router.get("/status", getAllStatuses);

// Get a single order status by ID
router.get("/status/:id", getStatusById);



module.exports = router;



