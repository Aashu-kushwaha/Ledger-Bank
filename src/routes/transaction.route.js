const {Router} = require("express")
const authMiddleware = require("../middlewares/auth.middleware.js")
const transactionController = require("../controllers/transaction.controller.js")

const transactionRoutes = Router()

transactionRoutes.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)
//middle variable name, middleware name,controller name
transactionRoutes.post("/system/initial-funds",authMiddleware.authSystemUserMiddleware,transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;