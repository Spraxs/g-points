const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    telegramId: {
        type: Number,
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    lastGivenPointsDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    pointsToGive: {
        type: Number,
        required: true
    },
})

module.exports = mongoose.model('User', userSchema)