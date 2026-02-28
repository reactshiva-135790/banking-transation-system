const mongoose = require('mongoose');
const leaderModel = require('./leader.model');

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        default: 'INR'
    },
}, {
    timestamps: true
});

// Compound index
accountSchema.index({ user: 1, status: 1 });

// ✅ Instance method
accountSchema.methods.getBalance = async function () {
    const balanceData = await leaderModel.aggregate([
        { 
            $match: { account: this._id } 
        },
        {
            $group: {
                _id: null,
                totalDebits: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0]
                    }
                },
                totalCredits: {
                    $sum: {
                        $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ["$totalCredits", "$totalDebits"] }
            }
        }
    ]);

    // If no transactions found
    if (!balanceData.length) {
        return 0;
    }

    return balanceData[0].balance;
};

const Account = mongoose.model('Account', accountSchema);

module.exports = Account;