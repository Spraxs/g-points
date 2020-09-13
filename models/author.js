const mongoose = require('mongoose')
const Reward = require('./reward')

const authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

// Mongoose pre remove check, dont remove author if he still has books
authorSchema.pre('remove', function(next) {
    const book = Reward.find( { author: this.id}, (err, rewards) => {
        if (err) {
            next(err)
        } else if (rewards.length > 0) {
            next(new Error('This author still has rewards '))
        } else {
            next()
        }
    })
})

module.exports = mongoose.model('Author', authorSchema)