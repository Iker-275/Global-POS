const {Router } = require("express");
const { login_get, signUp_get, signUp_post, login_post, logout_get } = require("../controllers/auth_controller");


const router = Router();

router.get("/signup",signUp_get);
router.post("/signup",signUp_post);
router.get("/login",login_get);
router.post("/login",login_post);
 router.get("/logout",logout_get);


module.exports = router;



