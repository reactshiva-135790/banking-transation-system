const mongoose = require('mongoose');


const leaderSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
        index: true
    },
     amount: {
        type: Number,
        required: [true, 'Amount is required'],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'Transaction is required'],
        index: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: [true, 'Type is required']
    }
}, { timestamps: true });


function preventLeaderModification(next) {
    if (!this.isNew) {
        return next(new Error('Leaders cannot be modified after creation'));
    }
    next();
}

leaderSchema.pre('findOneAndUpdate', preventLeaderModification);
leaderSchema.pre('updateOne', preventLeaderModification);
leaderSchema.pre('updateMany', preventLeaderModification);
leaderSchema.pre('update', preventLeaderModification);
leaderSchema.pre('remove', preventLeaderModification);

const Leader = mongoose.model('Leader', leaderSchema);

module.exports = Leader;