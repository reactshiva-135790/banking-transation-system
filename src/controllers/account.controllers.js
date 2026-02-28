const accountModel = require("../models/accounts.model");

const createAccount = async (req, res) => {
  try {
    const { user, currency, status } = req.body;

    // ✅ Validate required fields
    if (!user || !currency) {
      return res.status(400).json({
        message: "User and currency are required"
      });
    }

    // ✅ Create account
    const newAccount = await accountModel.create({
      user,
      currency,
      status
    });

    res.status(201).json({
      message: "Account created successfully",
      account: newAccount
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating account",
      error: error.message
    });
  }
};

const getUserAccounts = async (req, res) => {
  try {
    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({
      message: "User accounts fetched successfully",
      accounts
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching accounts",
      error: error.message
    });
  };
}

const getAccountBalance = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    const balance = await calculateAccountBalance(accountId);

    res.status(200).json({
      message: "Account balance fetched successfully",
      balance
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching account balance",
      error: error.message
    });
  }
};

module.exports = {
  createAccount,
  getUserAccounts,
  getAccountBalance
};