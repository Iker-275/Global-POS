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




module.exports = {requireAuth,checkUser};