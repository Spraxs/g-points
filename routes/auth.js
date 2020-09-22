const express = require('express')
const router = express.Router()
const Session = require('../models/session')

router.get('/', async (req, res) => {

    if (req.session.session) {
        res.redirect("/")
        return;
    }

    const givenToken = req.query.token;

    if (givenToken) {

        try {
            const session = await Session.findOne({token: givenToken}).exec()

            if (session) {
                req.session.session = session;

                res.redirect("/")
            } else {
                res.send("This token does not match")
            }

        } catch (e) {
            console.log(e)
        }
    } else {
        res.send("NO TOKEN")
    }
    // let rewards = []

    // try {
    //     rewards = await Reward.find().sort({ createdAt: 'desc' }).limit(10).exec()
    // } catch {
    //     rewards = []
    // }

    // let users = []

    // try {
    //     users = await User.find().sort({ score: 'desc' }).limit(10).exec()
    // } catch {
    //     users = []
    // }

    // res.render('index', { rewards: rewards, users: users })
})

module.exports = router;