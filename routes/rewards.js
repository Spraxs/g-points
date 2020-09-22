const express = require('express')
const router = express.Router()
const Reward = require('../models/reward')
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

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

        res.render('rewards/show', { reward: reward })

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
    })

    saveCover(reward, req.body.cover)

    try {
        const newReward = await reward.save()
        res.redirect(`rewards/${newReward.id}`)
    } catch {
        renderNewPage(res, reward, true)
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

        if (req.body.cover != null && req.body.cover !== '') {
            saveCover(reward, req.body.cover)
        }

        await reward.save()

        res.redirect(`/rewards/${reward.id}`)
    } catch {
        if (reward != null) {
            renderEditPage(res, reward, true)
        } else {
            res.redirect('/')
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