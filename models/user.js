const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    totalPoints: {
        type: Number,
        required: true
    },
    lastGivenPointAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    currentGivenPoints: {
        type: Number,
        required: true
    },
    totalGivenPoints: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('User', userSchema)