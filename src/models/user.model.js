const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please enter email."],
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email"],
    unique: [true, "Email already exists."]
  },
  name: {
    type: String,
    required: [true, "Please enter name"]
  },
  password: {
    type: String,
    required: [true, "Please enter password"],
    minlength: [6, "Password should contain more than 6 characters"],
    select: false//We cannot access or use anywhere
  },
  systemUser:{
  type:Boolean,
  default:false,
  immutable:true,
  select:false
  }
},
  {
    timestamps: true
  })
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return
  }
  // If password modified then hash new password and save
  const hash = await bcrypt.hash(this.password, 10)
  this.password = hash
  return

})

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)//If both password correct then return true
}

const userModel = mongoose.model("user", userSchema)

module.exports = userModel;