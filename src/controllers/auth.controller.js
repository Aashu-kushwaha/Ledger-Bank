/*
User Registration
User Login
JWT Token Generation
Logout
Profile Fetch 
*/
const userModel = require("../models/user.model.js")
const accountModel = require("../models/account.model.js") 
const jwt = require("jsonwebtoken")
const emailservice = require("../services/email.service.js")
const tokenBlackListModel = require("../models/blackList.model.js")


/** 
* -User register controller
* -POST/api/auth/register
*/
async function userRegisterController(req, res) {
  try {
    const { email, password, name } = req.body

    const isExists = await userModel.findOne({ email })
    if (isExists) {
      return res.status(422).json({
        message: "User already exists with this email.",
        status: "failed"
      })
    }

    const user = await userModel.create({ email, password, name })

    //  Auto-create account on registration
    await accountModel.findOneAndUpdate(
      { user: user._id },
      { user: user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    )

    res.cookie("token", token)

    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name },
      token
    })

    await emailservice.sendRegistrationEmail(user.email, user.name)

  } catch (err) {
    console.error("Register error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

/** 
* -User login controller
* -POST/api/auth/login
*/
async function userLoginController(req, res) {
  try {
    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({ message: "Email or password is invalid." })
    }

    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({ message: "Email or password is invalid." })
    }

    // Auto-create account on login if it doesn't already exist
    await accountModel.findOneAndUpdate(
      { user: user._id },
      { user: user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    )

    res.cookie("token", token)

    res.status(200).json({
      user: { id: user._id, email: user.email, name: user.name },
      token
    })

    await emailservice.sendLoginEmail(user.email, user.name)

  } catch (err) {
    console.error("Login error:", err)
    return res.status(500).json({ message: "Internal server error." })
  }
}

async function userLogoutController(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(400).json({ message: "No token found." })
  }

  //  Check if already blacklisted before trying to add
  const alreadyBlacklisted = await tokenBlackListModel.findOne({ token })
  if (alreadyBlacklisted) {
    res.clearCookie("token")
    return res.status(200).json({ message: "User logged out successfully." })
  }

  await tokenBlackListModel.create({ token })
  res.clearCookie("token")

  return res.status(200).json({ message: "User logged out successfully." })
}

module.exports = { userRegisterController, userLoginController,userLogoutController }