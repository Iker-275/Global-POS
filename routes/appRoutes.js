const { Router } = require("express");
const { login_get, signUp_get, signUp_post, login_post, logout_get } = require("../controllers/auth_controller");
const {addMenuItem,updateMenuItem,deleteMenuItem,getMenuItems,} = require("../controllers/menuController");
const auth = require("../middleware/authMiddleware")
const allowRoles = require("../middleware/roleMiddleware")
const {createOrder,updateOrder,deleteOrder,getOrders,getOrderById,getOrdersByDate, cancelOrder,getOrdersHome,getOrdersReport} = require("../controllers/orderController")
const {openDailyRecord,closeDailyRecord, getActiveDailyRecord,fetchTodaysRecord,checkTodayRecordStatus,reopenTodaysRecord} = require("../controllers/recordController");
const { getDailyRecordById, listDailyRecords } = require("../services/dailyRecordService");
const { createStatus, updateStatus, deleteStatus, getAllStatuses, getStatusById, toggleVisibility } = require("../controllers/statusController")
const {getAllUsers,getUserById,updateUser,toggleUserActive,deleteUser} = require("../controllers/user_controller");
const {createRole,getAllRoles,getRoleById,updateRole,deleteRole} = require("../controllers/roleController");

const {createExpense,updateExpense,deleteExpense,getExpense,getExpenses} = require("../controllers/expenseController");
const {
  createCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer
} = require("../controllers/customerController");
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

router.get(
    "/order/home",
   // auth,
   // allowRoles("admin", "cashier", "manager"),
    getOrdersHome
);

router.get(
    "/order/report",
   // auth,
   // allowRoles("admin", "cashier", "manager"),
    getOrdersReport
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
router.get("/sales/today", fetchTodaysRecord);
router.get("/sales/today/status", checkTodayRecordStatus);
router.post("/sales/today/reopen", reopenTodaysRecord);



// Create a new order status
router.post("/status", createStatus);

// order status
router.put("/status/:id", updateStatus);
router.put("/status/toggle/:id", toggleVisibility);
router.delete("/status/:id", deleteStatus);
router.get("/status", getAllStatuses);
router.get("/status/:id", getStatusById);

//  users 
router.get("/user",  getAllUsers);
router.get("/user/:id",  getUserById);
router.put("/user/:id",  updateUser);
router.patch("/user/:id/toggle-active",  toggleUserActive);
router.delete("/user/:id",  deleteUser);



//  role
router.post("/role", createRole);
router.get("/role", getAllRoles);
router.get("/role/:id", getRoleById);
router.put("/role/:id", updateRole);
router.delete("/role/:id", deleteRole);

// expense
router.post("/expense", createExpense);
router.put("/expense/:id", updateExpense);
router.delete("/expense/:id", deleteExpense);
router.get("/expense", getExpenses);
router.get("/expense/:id", getExpense);


router.post("/customer", createCustomer);
router.get("/customer", getCustomers);
router.get("/customer/:id", getCustomerById);
router.put("/customer/:id", updateCustomer);


module.exports = router;



