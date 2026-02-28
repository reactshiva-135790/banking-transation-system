const transactionModel = require("../models/transation.model");
const accountModel = require("../models/accounts.model");
const ledgerModel = require("../models/leader.model");
const mongoose = require("mongoose");

const createTransaction = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

        // ✅ Validate input
        if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "All fields are required" });
        }

        if (amount <= 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Amount must be greater than 0" });
        }

        // ✅ Idempotency check (WITH SESSION)
        const existingTransaction = await transactionModel
            .findOne({ idempotencyKey })
            .session(session);

        if (existingTransaction) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({
                message: `Transaction already exists with status ${existingTransaction.status}`,
            });
        }

        // ✅ Check accounts
        const fromAccountDoc = await accountModel
            .findById(fromAccount)
            .session(session);

        const toAccountDoc = await accountModel
            .findById(toAccount)
            .session(session);

        if (!fromAccountDoc || !toAccountDoc) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                message: "One or both accounts not found",
            });
        }

        // ✅ Check account status
        if (
            fromAccountDoc.status !== "ACTIVE" ||
            toAccountDoc.status !== "ACTIVE"
        ) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Both accounts must be ACTIVE",
            });
        }

        // ✅ Check balance
        if (fromAccountDoc.balance < amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Insufficient balance",
            });
        }

        // ✅ Create transaction (PENDING)
        const transaction = await transactionModel.create(
            [
                {
                    fromAccount,
                    toAccount,
                    amount,
                    idempotencyKey,
                    status: "PENDING",
                },
            ],
            { session }
        );

        // ✅ Update balances
        fromAccountDoc.balance -= amount;
        toAccountDoc.balance += amount;

        await fromAccountDoc.save({ session });
        await toAccountDoc.save({ session });

        // ✅ Ledger entries
        await ledgerModel.create(
            [
                {
                    account: fromAccount,
                    type: "DEBIT",
                    amount,
                    transaction: transaction[0]._id,
                },
                {
                    account: toAccount,
                    type: "CREDIT",
                    amount,
                    transaction: transaction[0]._id,
                },
            ],
            { session }
        );

        // ✅ Mark transaction completed
        transaction[0].status = "COMPLETED";
        await transaction[0].save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: transaction[0],
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Transaction error:", error);

        return res.status(500).json({
            message: "Transaction failed",
            error: error.message,
        });
    }
};

const createInitialFundTransaction = async (req, res) => {
    try {
        const { toAccount, amount, idempotencyKey } = req.body;
        if (!toAccount || !amount || !idempotencyKey) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const toAccountUser = await accountModel.findOne({ _id: toAccount });
        if (!toAccountUser) {
            return res.status(404).json({ message: "To account not found" });
        }

        const fromUserAccount = await accountModel.findOne({
            systemUser: true,
            user: req.user._id
        });

        if (!fromUserAccount) {
            return res.status(404).json({ message: "System user account not found" });
        }

       const session = await mongoose.startSession();
       session.startTransaction();

       const transaction = new transactionModel(
            [
                {
                    fromAccount: fromUserAccount._id,
                    toAccount,
                    amount,
                    idempotencyKey,
                    status: "PENDING",
                },
            ],
        );

        const debitLedgerEntry = {
            account: fromUserAccount._id,
            type: "DEBIT",
            amount,
            transaction: transaction[0]._id,
            type:"DEBIT"
        };

        const creditLedgerEntry = {
            account: toAccount,
            type: "CREDIT",
            amount,
            transaction: transaction[0]._id,
            type:"CREDIT"
        };

        await ledgerModel.create([debitLedgerEntry, creditLedgerEntry], { session });

        fromUserAccount.balance -= amount;
        await fromUserAccount.save({ session });

        const toAccountDoc = await accountModel.findById(toAccount).session(session);
        toAccountDoc.balance += amount;
        await toAccountDoc.save({ session });

        transaction[0].status = "COMPLETED";
        await transaction[0].save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Initial fund transaction completed successfully",
            transaction: transaction[0],
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to create initial fund transaction",
            error: error.message,
        });
    }
}

module.exports = {
    createTransaction,
    createInitialFundTransaction
};