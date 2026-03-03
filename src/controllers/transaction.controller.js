const transactionModel = require("../models/transaction.model.js")
const ledgerModel = require("../models/ledger.model.js")
const emailService = require("../services/email.service.js")
const accountModel = require("../models/account.model.js")
const mongoose = require("mongoose")

/*
1) Validate request
2) Validate idempotency key
3) Check account status
4) Derive sender balance from ledger
5) Create transaction PENDING
6) Create DEBIT ledger entry
7) Create CREDIT ledger entry
8) Mark transaction COMPLETED
9) Commit MongoDB session
10) Send email notification to SENDER and RECEIVER
*/

async function createTransaction(req, res) {

  const { fromAccount, toAccount, amount, idempotencyKey } = req.body

  // 1 Validate request
  if (!fromAccount || !toAccount || amount == null || !idempotencyKey || amount <= 0) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount and idempotencyKey are required. Amount must be greater than 0."
    })
  }

  try {

    const fromUserAccount = await accountModel.findById(fromAccount)
    const toUserAccount = await accountModel.findById(toAccount).populate("user") // ✅ populate user

    if (!fromUserAccount || !toUserAccount) {
      return res.status(400).json({
        message: "Invalid fromAccount or toAccount"
      })
    }

    // 2 Validate idempotency key
    const existingTransaction = await transactionModel.findOne({ idempotencyKey })
    if (existingTransaction) {
      return res.status(200).json({
        message: "Transaction already processed or in progress.",
        transaction: existingTransaction
      })
    }

    // 3 Check account status
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
      return res.status(400).json({
        message: "Both accounts must be ACTIVE."
      })
    }

    // 4 Check balance
    const balance = await fromUserAccount.getBalance()
    if (balance < amount) {
      return res.status(400).json({
        message: `Insufficient balance. Current balance: ${balance}`
      })
    }

    // 5 Start MongoDB session
    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const transaction = new transactionModel({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
      })

      await transaction.save({ session })

      // 6 DEBIT entry
      await ledgerModel.create([{
        account: fromAccount,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
      }], { session })

      // 7 CREDIT entry
      await ledgerModel.create([{
        account: toAccount,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
      }], { session })

      // 8 Mark COMPLETED
      transaction.status = "COMPLETED"
      await transaction.save({ session })

      // 9 Commit
      await session.commitTransaction()
      session.endSession()

      // 10 Send emails AFTER commit (outside transaction)

      // Email to SENDER
      await emailService.sendTransactionEmail(
        req.user.email,
        req.user.name,
        amount,
        toAccount
      )

      //  Email to RECEIVER
      await emailService.moneyReceivedEmail(
        toUserAccount.user.email,
        toUserAccount.user.name,
        amount,
        fromAccount
      )

      return res.status(200).json({
        message: "Transaction processed successfully",
        transaction
      })

    } catch (error) {
      await session.abortTransaction()
      session.endSession()

      return res.status(500).json({
        message: "Transaction failed",
        error: error.message
      })
    }

  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
}

// INITIAL FUNDS (SYSTEM USER ONLY)

async function createInitialFundsTransaction(req, res) {

  const { toAccount, amount, idempotencyKey } = req.body

  if (!toAccount || !amount || !idempotencyKey || amount <= 0) {
    return res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required."
    })
  }

  try {

    const toUserAccount = await accountModel.findById(toAccount).populate("user") // ✅ populate user

    if (!toUserAccount) {
      return res.status(400).json({
        message: "Invalid toAccount"
      })
    }

    if (!req.user.systemUser) {
      return res.status(403).json({
        message: "Only system user can create initial funds."
      })
    }

    const fromUserAccount = await accountModel.findOne({
      user: req.user._id,
      status: "ACTIVE"
    })

    if (!fromUserAccount) {
      return res.status(400).json({
        message: "System user account not found."
      })
    }

    const session = await mongoose.startSession()

    try {
      session.startTransaction()

      const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
      })

      await transaction.save({ session })

      await ledgerModel.create([{
        account: fromUserAccount._id,
        amount,
        transaction: transaction._id,
        type: "DEBIT"
      }], { session })

      await ledgerModel.create([{
        account: toAccount,
        amount,
        transaction: transaction._id,
        type: "CREDIT"
      }], { session })

      transaction.status = "COMPLETED"
      await transaction.save({ session })

      await session.commitTransaction()
      session.endSession()

      // Send email AFTER commit, user is populated
      await emailService.moneyReceivedEmail(
        toUserAccount.user.email,
        toUserAccount.user.name,
        amount,
        fromUserAccount._id
      )

      return res.status(201).json({
        message: "Initial funds transaction completed successfully.",
        transaction
      })

    } catch (error) {
      await session.abortTransaction()
      session.endSession()

      return res.status(500).json({
        message: "Transaction failed",
        error: error.message
      })
    }

  } catch (error) {
    return res.status(500).json({
      message: error.message
    })
  }
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction
}