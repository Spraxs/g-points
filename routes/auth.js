const express = require('express')
const router = express.Router()
const TokenCache = require('../cache/TokenCache')

router.get('/', async (req, res) => {

    const sessionUserId = req.session.userId;

    // Check if sessions is active
    if (sessionUserId && TokenCache.getTokenByUserId(sessionUserId)) {
        res.redirect("/")
        return;
    }

    const givenToken = req.query.token;

    if (givenToken) {


        const token = TokenCache.getTokenByToken(givenToken);

        if (token) {

            console.log("Matched token!")

            req.session.userId = token.userId;

            res.redirect("/")
        } else {
            res.send("This token does not match")
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