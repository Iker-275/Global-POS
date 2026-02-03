const { Router } = require("express");
const { login_get, signUp_get, signUp_post, login_post, logout_get } = require("../controllers/auth_controller");
const {addMenuItem,updateMenuItem,deleteMenuItem,getMenuItems,} = require("../controllers/menuController");
const auth = require("../middleware/authMiddleware")
const allowRoles = require("../middleware/roleMiddleware")
const {createOrder,updateOrder,deleteOrder,getOrders,getOrderById,getOrdersByDate, cancelOrder,getOrdersHome,getOrdersReport, bulkPayOrders} = require("../controllers/orderController")
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
router.put("/order/bulk-pay", bulkPayOrders);
router.put("/order/:id",updateOrder);
router.delete("/order/:id",deleteOrder);
router.get("/order", getOrders);
router.get("/order/home",getOrdersHome);
router.get( "/order/report",getOrdersReport);
router.get("/order/:id",getOrderById);
router.post("/order/cancel/:id", cancelOrder);
router.get("/order/date/:date",getOrdersByDate);


router.post("/sales/open",
//   auth,
//   allowRoles("admin", "manager"),
  openDailyRecord);
router.post("/sales/close",closeDailyRecord);
router.get("/sales/today",getActiveDailyRecord);
router.get("/sales/all",listDailyRecords);
router.get("/sales/:id",getDailyRecordById);
router.get("/sales/today", fetchTodaysRecord);
router.get("/sales/today/status", checkTodayRecordStatus);
router.post("/sales/today/reopen", reopenTodaysRecord);



// order status
router.post("/status", createStatus);
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



