const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlackListModel = require("../models/blackList.model")

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access, token is missing." })
  }

  // ✅ This will now actually work
  const isBlackListed = await tokenBlackListModel.findOne({ token })
  if (isBlackListed) {
    return res.status(401).json({ message: "Unauthorized access, token is invalid." })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.userId)
    req.user = user
    return next()
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized access, token is INVALID." })
  }
}

async function authSystemUserMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access, token is missing." })
  }

  //  Actually check blacklist
  const isBlackListed = await tokenBlackListModel.findOne({ token })
  if (isBlackListed) {
    return res.status(401).json({ message: "Unauthorized access, token is invalid." })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.userId).select("+systemUser")
    if (!user.systemUser) {
      return res.status(403).json({ message: "Forbidden access, not a system user." })
    }
    req.user = user
    return next()
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized access, token is INVALID." })
  }
}

module.exports = { authMiddleware, authSystemUserMiddleware }