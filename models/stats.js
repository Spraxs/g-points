const mongoose = require('mongoose')

const statsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    totalExecutedRewards: {
        type: Number,
        required: true,
    },
    totalBoughtRewards: {
        type: Number,
        required: true,
    },
    totalPoints: {
        type: Number,
        required: true
    },
    totalGivenPoints: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('Stats', statsSchema)