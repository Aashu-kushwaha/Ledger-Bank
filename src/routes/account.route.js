const express = require("express")
const {authMiddleware} = require("../middlewares/auth.middleware")
const {createAccountController,getUserAccountsController,getAccountBalanceController} = require("../controllers/account.controller.js")


const router = express.Router()

router.post("/", authMiddleware, createAccountController)
router.get("/",authMiddleware,getUserAccountsController)
router.get("/balance/:accountId",authMiddleware,getAccountBalanceController)

module.exports = router;