const express = require('express')
const router = express.Router()
const Reward = require('../models/reward')
const User = require('../models/user')
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
const pointsEmoji = '💯'

const { sendMessage, sendVariableMessage } = require('../telegram_bot')

// All Rewards Route
router.get('/', async (req, res) => {
    let query = Reward.find()
    if (req.query.name != null && req.query.name != '') {
        query = query.regex('name', new RegExp(req.query.name, 'i'))
    }

    try {
        const rewards = await query.exec()
        res.render('rewards/index', {
            rewards: rewards,
            searchOptions: req.query
        })
    } catch {
       res.redirect('/') 
    }
})

// New Reward Route
router.get('/new', async (req, res) => {
    renderNewPage(res, new Reward())
})

// Show Reward route
router.get('/:id', async (req, res) => {
    try {
        const reward = await Reward.findById(req.params.id)/*.populate('author')*/.exec()
        const users = await User.find({})
        var user = await User.findById(req.session.userId);

        user = null // TODO REMOVE

        res.render('rewards/show', { 
            reward: reward,
            users: users,
            user: user,
            errorMessage: req.query.errorMessage,
            successMessage: req.query.successMessage
        })

    } catch {
        res.redirect('/')
    }
})

// Edit Reward Route
router.get('/:id/edit', async (req, res) => {
    try {
        const reward = await Reward.findById(req.params.id)
        renderEditPage(res, reward)
    } catch {
        res.redirect('/')
    }
})


// Create Reward Route
router.post('/', async (req, res) => {
    const reward = new Reward({
        name: req.body.name,
        description: req.body.description,
        cost: req.body.cost,
        messageToExecutor: req.body.messageToExecutor,
        messageToBuyer: req.body.messageToBuyer
    })

    saveCover(reward, req.body.cover)

    try {
        const newReward = await reward.save()
        res.redirect(`rewards/${newReward.id}`)
    } catch {
        renderNewPage(res, reward, true)
    }
})

// Buy Reward Route
router.post('/:id/buy', async (req, res) => {
    let reward
    let user
    let executedUser

    try {
        reward = await Reward.findById(req.params.id)

        // Get user that is paying for reward
        user = await User.findById(req.session.userId)

        if (user.points < reward.cost) {
            const ERROR_MESSAGE = "You do not have enough g-points!"

            res.redirect(`/rewards/${reward.id}/?errorMessage=${ERROR_MESSAGE}`)
            return;
        }

        // Get user that executes reward
        executedUser = await User.findById(req.body.executor)

        user.points = user.points - reward.cost; // Subtract points from buyer

        await user.save()

        // Send telegram messages
        sendVariableMessage(executedUser.telegramId, "You've been assigned by @" + user.userName + " to complete the following task:\n\n" +
            reward.messageToExecutor + "\n\n" +
            `@${user.userName} paid: ${reward.cost} ${pointsEmoji}`
            , "@" + user.userName)

        sendVariableMessage(user.telegramId, "You've assigned a task to  @" + executedUser.userName + "!\n\n" +
            reward.messageToBuyer + "\n\n" +
            `You paid: ${reward.cost} ${pointsEmoji}`
            , "@" + executedUser.userName)

        // Update web page
        const SUCCESS_MESSAGE = "You successfully bought this reward!"
        res.redirect(`/rewards/${reward.id}/?successMessage=${SUCCESS_MESSAGE}`)
    } catch (e) {
        console.log(e);
        if (reward != null) {
            var ERROR_MESSAGE = "Something went wrong.";
            if (!user) ERROR_MESSAGE += " Could not find user!"
            if (!executedUser) ERROR_MESSAGE += " Could not find executing user!".

            res.redirect(`/rewards/${reward.id}/?errorMessage=${ERROR_MESSAGE}`)
        } else {
            res.redirect('/')
        }
    }
})

// Update Reward Route
router.put('/:id', async (req, res) => {
    let reward


    try {
        reward = await Reward.findById(req.params.id)

        reward.name = req.body.name
        reward.description = req.body.description
        reward.cost = req.body.cost
        reward.messageToExecutor = req.body.messageToExecutor
        reward.messageToBuyer = req.body.messageToBuyer

        if (req.body.cover != null && req.body.cover !== '') {
            saveCover(reward, req.body.cover)
        }

        await reward.save()

        res.redirect(`/rewards/${reward.id}`)
    } catch {
        if (reward != null) {
            renderEditPage(res, reward, true)
        } else {
            res.redirect('/', { errorMessage: "Could not remove reward" })
        }
    }
})

// Delete Reward Page
router.delete('/:id', async (req, res) => {
    let reward
    try {
        reward = await Reward.findById(req.params.id)

        await reward.remove()

        res.redirect('/rewards')
    } catch {
        if (reward != null) {
            res.render('rewards/show', { reward: reward, errorMessage: "Could not remove reward" })
        } else {
            res.redirect('/')
        }
    }
})

async function renderNewPage(res, reward, hasError = false) {
    renderFormPage(res, reward, 'new', hasError)
}

async function renderEditPage(res, reward, hasError = false) {
    renderFormPage(res, reward, 'edit', hasError)
}

async function renderFormPage(res, reward, form, hasError = false) {
    try {
        // const authors = await Author.find({})
        const params = {
            // authors: authors,
            reward: reward
        }

        if (hasError) {
            if (form === 'edit') params.errorMessage = 'Error Updating Reward';
            else params.errorMessage = 'Error Creating Reward'
        }
        res.render(`rewards/${form}`, params)
    } catch {
        res.redirect('/rewards')
    }
}

function saveCover(reward, coverEncoded) {
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)

    if (cover != null && imageMimeTypes.includes(cover.type)) {
        reward.coverImage = new Buffer.from(cover.data, 'base64')
        reward.coverImageType = cover.type
    }
}

module.exports = router;