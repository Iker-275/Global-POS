const express = require("express");
const cookieParser = require("cookie-parser");

require("dotenv").config();
const appRoutes = require("./routes/appRoutes")
const connectDB = require("./db/connect")
const {requireAuth,checkUser }= require("./middleware/authMiddleware")
const { seedStatuses }= require("./seeders/statusSeeder")
const cors = require("cors")

const app = express();
app.use(cors());

 app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser())
app.use(checkUser);
// app.use(allowRoles);


app.set("view engine","ejs");
const PORT = process.env.PORT || 5000;


 
app.get("/login",checkUser,function(req,res){
res.render("login");
})


app.get("/",requireAuth,(req,res)=>{
    res.render("home");
})

app.post("/",function(req,res){
    
})

app.use("/POS",appRoutes);


app.use((err, req, res, next) => {
   // console.log("error "+err);
    
  res.status(400).send(err.message)
})

app.listen(PORT,async()=>{
    await connectDB(process.env.DB_URL);
    console.log("Server started on port :"+PORT);
   // seedStatuses();
    
})











