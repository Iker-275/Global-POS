const mongoose = require("mongoose")
const { isEmail } = require("validator")
const bcrypt = require("bcrypt")


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: [isEmail, 'Please enter a valid email']
    },
    name:{
        type: String,
        lowercase: true,

    },
    phone:{
        type: String,
        unique:true,
        required:true
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    role:{
        type:String,
        required:true,
        lowercase:true,
        default:"user"
    },
    active:{
        type:Boolean,
        default:false
    }

},
{ timestamps: true }
)

userSchema.pre('save', async function (next) {
    

    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
   // console.log('user about to be created',this);
    next;
})



// userSchema.statics.login = async function(email, password) {
//     const user = await this.findOne({ email });

//     if (user) {
//         //bcrypt checks for hashing automatically
//         const auth = await bcrypt.compare(password, user.password)

//         if (auth) {
//             return user;
//         }
//         throw Error("Incorrect Password")
//     }


//     throw Error("Incorrect email")

// }
userSchema.statics.login = async function (identifier, password) {
  // Determine if identifier is email or phone
  const query = identifier.includes("@")
    ? { email: identifier.toLowerCase() }
    : { phone: identifier };

  const user = await this.findOne(query);

  if (!user) {
    throw Error("Incorrect email or phone");
  }

  // Check active status
  if (!user.active) {
    throw Error("Account inactive");
  }

  const auth = await bcrypt.compare(password, user.password);

  if (!auth) {
    throw Error("Incorrect Password");
  }

  return user;
};

userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });


const User = mongoose.model('user', userSchema);
module.exports = User;


