const express = require('express')
const router = express.Router()
const Reward = require('../models/reward')
const User = require('../models/user')

router.get('/', async (req, res) => {
    let rewards = []

    try {
        rewards = await Reward.find().sort({ createdAt: 'desc' }).limit(10).exec()
    } catch {
        rewards = []
    }

    let users = []

    try {
        users = await User.find().sort({ score: 'desc' }).limit(10).exec()
    } catch {
        users = []
    }

    res.render('index', { rewards: rewards, users: users })
})

module.exports = router;