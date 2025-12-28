const jwt = require("jsonwebtoken");
const User = require("../models/userModel")

const requireAuth = (req,res,next)=>{
const token = req.cookies.jwt;
 //check if token is valid
    if (token) {
        jwt.verify(token, 'secrety', (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/login');

            } else {
                console.log(decodedToken);

                next();
            }
        })
    } else {
        res.redirect('/login');
    }

}



const requireAuth2 = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, "secrety");

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists"
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: "User account is disabled"
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};




//check currentUser
const checkUser = (req, res, next) => {
    const token = req.cookies.jwt;
    //check if token is valid
    if (token) {
        jwt.verify(token, 'secrety', async (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.locals.user = null; //used for evaluation
                next();

            } else {
                //  console.log(decodedToken);
                let user = await User.findById(decodedToken.id);

                res.locals.user = user;
                next();
            }
        })
    } else {
        res.locals.user = null; //used for evaluation
        next();
    }
}

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};



module.exports = {requireAuth,checkUser,requireAuth2,requireRole};