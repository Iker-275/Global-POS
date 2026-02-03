const User = require("../models/userModel")
const jwt = require("jsonwebtoken")
const Customer = require("../models/customerModel");


const handleErrors = (err) => {
    // console.log("error" + err);

    let errors = { email: "", password: "" }

    if (err.message === "User inactive") {
        errors.email =
            "Your account has been deactivated. Please contact an administrator.";
        return errors;
    }

    //incorrect email
    if (err.message === 'Incorrect Password') {
        errors.password = "You have entered an incorrect password.Try again.";
        return errors;
    }

    // if (err.message === 'Incorrect email') {
    //     errors.email = "Email is not registered.Try again.";
    //     return errors;
    // }
    if (err.message === "Incorrect email or phone") {
    errors.email = "Email or phone is not registered.";
    return errors;
  }

    //duplicate error code
    if (err.code === 11000) {
        errors.email = "That email is already registered";
        return errors;
    }


    //validation errors
    if (err.message.includes('user validation failed')) {
        // console.log(Object.values(err.errors));
        Object.values(err.errors).forEach(
            ({ properties }) => {
                errors[properties.path] = properties.message;
            }
        )

    }

    return errors;
}

const maxAge = 1 * 24 * 60 * 60; //age in seconds -1 day
const createToken = (id) => {
    return jwt.sign({ id }, 'secrety', {
        expiresIn: maxAge,

    });
}

const signUp_get = async (req, res) => {
    res.render("signup");
}



// const signUp_post = async (req, res) => {
//   const { email, name, password, role, phone } = req.body;

//   try {
//     // 🔍 Check if phone already exists
//     const existingPhone = await User.findOne({ phone });

//     if (existingPhone) {
//       return res.status(400).json({
//         success: false,
//         errors: {
//           phone: "A user with this phone number already exists"
//         }
//       });
//     }

//     const user = await User.create({
//       email,
//       name,
//       password,
//       role,
//       phone
//     });

//     const token = createToken(user._id);

//     res.status(201).json({
//       success: true,
//       token,
//       user
//     });

//   } catch (error) {
//     console.log(error);

//     const errors = handleErrors(error);

//     res.status(400).json({
//       success: false,
//       errors
//     });
//   }
// };




const signUp_post = async (req, res) => {
  const { email, name, password, role, phone } = req.body;

  try {
    // ❌ User already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: {
          phone: "An account with this phone number already exists"
        }
      });
    }

    // 🔍 Check existing customer
    let existingCustomer = null;
    if (role === "customer") {
      existingCustomer = await Customer.findOne({ phone });
    }

    // 👤 Create user
    const user = await User.create({
      email,
      name,
      password,
      role,
      phone,
      active: role === "customer"
    });

    // 🔗 LINK or CREATE customer
    if (role === "customer") {
      if (existingCustomer) {
        // 🔄 Upgrade existing customer
        existingCustomer.userId = user._id;
        existingCustomer.name = name; // update name if needed
        await existingCustomer.save();
      } else {
        // 🆕 Create new customer
        await Customer.create({
          name,
          phone,
          userId: user._id
        });
      }
    }

    const token = createToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      errors: handleErrors(error)
    });
  }
};

const login_get = async (req, res) => {
    res.render('login');
}

// const login_post = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await User.login(email, password);
//         const token = createToken(user._id);
//          res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });

//         res.status(200).json({ success: true, token,user });


//     } catch (error) {
//     console.log(error);
//        const errors = handleErrors(error);
//         res.status(400).json({ success: false ,errors})
//         // console.log("error" );


//     }
// }
const login_post = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.login(email, password);

        // 🚫 Block inactive users
        if (!user.active) {
            throw Error("User inactive");
        }

        const token = createToken(user._id);

        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000
        });

        res.status(200).json({
            success: true,
            token,
            user
        });

    } catch (error) {
        console.log(error);
        const errors = handleErrors(error);

        res.status(400).json({
            success: false,
            errors
        });
    }
};


const logout_get = async (req, res) => {

    res.cookie('jwt', '', { maxAge: 0 });

    res.redirect('/');
}


module.exports = { signUp_get, signUp_post, login_get, login_post, logout_get };