const accountModel = require("../models/account.model")

async function createAccountController(req, res) {
  try {
    const account = await accountModel.create({
      user: req.user._id
    });

    console.log("Account created by user:", req.user._id.toString());

    return res.status(201).json({
      message: "Account created successfully.",
      account
    });

  } catch (err) {
    // MongoDB duplicate key error code is 11000
    if (err.code === 11000) {
      const existingAccount = await accountModel.findOne({ user: req.user._id });
      return res.status(200).json({
        message: "Account already exists.",
        account: existingAccount
      });
    }

    console.error("Error creating account:", err);
    return res.status(500).json({
      message: "Internal server error while creating account."
    });
  }
}

async function getUserAccountsController(req, res) {
  try {
    const accounts = await accountModel.find({ user: req.user._id });

    return res.status(200).json({
      accounts
    });

  } catch (err) {
    console.error("Error fetching accounts:", err);
    return res.status(500).json({
      message: "Internal server error while fetching accounts."
    });
  }
}

async function getAccountBalanceController(req, res) {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findById(accountId);

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to view this account."
      });
    }

    const balance = await account.getBalance();

    return res.status(200).json({
      accountId: account._id,
      balance
    });

  } catch (err) {
    console.error("Error fetching balance:", err);
    return res.status(500).json({
      message: "Internal server error while fetching balance."
    });
  }
}

module.exports = { createAccountController, getUserAccountsController, getAccountBalanceController }