if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const session = require('express-session')
const app = express()
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

const indexRouter = require('./routes/index')
// const authorRouter = require('./routes/authors')
// const bookRouter = require('./routes/books')
const rewardRouter = require('./routes/rewards')
const authRouter = require('./routes/auth')

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')
app.use(expressLayouts)
app.use(methodOverride('_method'))
app.use(express.static('public'))
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))
app.use(bodyParser.urlencoded({ limit: "10mb", extended: false }))

const mongoose = require('mongoose')

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true, useUnifiedTopology: true })

const db = mongoose.connection;

db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

// Authentication first, otherwise will have no access because of auth check middleware
app.use("/auth", authRouter)
app.use('/', isAuthenticated, indexRouter)
app.use('/rewards',  isAuthenticated, rewardRouter)

app.listen(process.env.PORT || 3000)

require('./telegram_bot')

function isAuthenticated(req, res, next) {
    if (req.session.session) {
        return next();
    }

    res.send("Cannot access this page")
}