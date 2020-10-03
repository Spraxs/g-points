const { Telegraf } = require('telegraf')
const Telegram = require('telegraf/telegram')
const tgresolve = require("tg-resolve");
const CONFIG = require("./config");

const TokenCache = require('./cache/TokenCache')

console.log(process.env.BOT_TOKEN);

const User = require('./models/user')
const { nextTick } = require('process');

const tBot = new Telegram(process.env.BOT_TOKEN)
const bot = new Telegraf(process.env.BOT_TOKEN)
const resolver = new tgresolve.Tgresolve(process.env.BOT_TOKEN);

bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
  })

//   bot.start((ctx) => {
//     throw new Error('Example error')
//   })

// bot.start((ctx) => ctx.reply('Welcome!'))
// bot.help((ctx) => ctx.reply('Send me a sticker'))
// bot.on('sticker', (ctx) => ctx.reply('👍'))
// bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('register', (ctx) => {
    const tUser = ctx.update.message.from;

    if (!tUser.username) {
        ctx.reply('You cannot register youself without a username! Please create a telegram username before registering.')
        return;
    }

    const chatType = ctx.update.message.chat.type;

    ctx.reply(`@${tUser.username}, please follow these steps carefully to activate the bot!\n\n`+
    `1. Click the link ${process.env.BOT_LINK}\n` +
    `2. Press the 'START' / 'RESTART' button.\n\n` +
    `Thank you in advance!`)

    if (chatType === 'supergroup') {
        const chatId = ctx.update.message.chat.id;
        const messageId = ctx.update.message.message_id;
        tBot.deleteMessage(chatId, messageId)
    }

    const user = ctx.update.message.from;
    registerUser(user, (message) => {
        tBot.sendMessage(user.id, message);
    })
})

bot.command('rewards', async (ctx) => {
    const chatType = ctx.update.message.chat.type;

    if (chatType === 'supergroup') {
        const chatId = ctx.update.message.chat.id;
        const messageId = ctx.update.message.message_id;
        tBot.deleteMessage(chatId, messageId)
    }

    const tUser = ctx.update.message.from;

    try {

        getCurrentToken(tUser, (currentToken, user) => {

            if (currentToken) {
                tBot.sendMessage(user.telegramId, "Current session found: " + process.env.WEBSITE_DOMAIN + "auth?token=" + currentToken.token)
                return;
            }

            // If there is no current session
            TokenCache.createToken(user.id, (newToken) => {
                tBot.sendMessage(user.telegramId, "New session created: " + process.env.WEBSITE_DOMAIN + "auth?token=" + newToken.token)
            })
            

        }, (noUserMsg) => {

            tBot.sendMessage(tUser.id, noUserMsg)
        })

    } catch (e) {

    }

})

bot.entity("mention", async (ctx) => {

    const message = ctx.update.message.text;
    const messageId = ctx.update.message.message_id;

    let name = message.split('@')[1].split(' ')[0];

    const chatType = ctx.update.message.chat.type;
    const chatId = ctx.update.message.chat.id;

    if (chatType !== 'supergroup') return;
    if (!message.includes(CONFIG.EMOJI.POINTS)) return;

    if (name.includes(CONFIG.EMOJI.POINTS)) name = name.split(emoji)[0]; 

    const tUser = ctx.update.message.from;

    try {
        const givenUser = await User.findOne({userName: name})
        const user = await User.findOne({telegramId: tUser.id})

        if (!user) {
            tBot.sendMessage(tUser.id, "Je bent nog niet geregistreerd! Je kan jezelf registreren met '/register'!");
            return;
        }

        if (!givenUser) {
            tUser.sendMessage(tUser.id, "De gebruiker '" + name + "' staat niet geregistreerd. De gebruiker moet eerst registreren met '/register'!")
            return;
        }

        if (user.telegramId === tUser.id) {
            tBot.deleteMessage(chatId, messageId)
            tBot.sendMessage(user.telegramId, `Je kan jezelf geen G-Punten geven! ${CONFIG.EMOJI.CRAZY}`)
            return;
        }

        if (!canUserGivePoints(user, 1)) {
            tBot.deleteMessage(chatId, messageId)
            tBot.sendMessage(user.telegramId, `Je hebt geen G-Punten meer! ${CONFIG.EMOJI.POINTS}${CONFIG.EMOJI.SAD}`)
            return;
        }

        user.pointsToGive -= 1;

        givenUser.points++;

        tBot.sendMessage(user.telegramId, `Je hebt een G-Punt gegeven aan @${givenUser.userName}! ${CONFIG.EMOJI.POINTS}\n\n` +
        `Je hebt nu nog ${user.pointsToGive} G-Punten om weg te geven. ${CONFIG.EMOJI.POINTS}` )

        tBot.sendMessage(givenUser.telegramId, `Je hebt een G-Punt onvangen van @${user.userName}! ${CONFIG.EMOJI.POINTS}\n\n` +
            `Je hebt nu ${givenUser.points} G-Punten. ${CONFIG.EMOJI.POINTS}` )

         await user.save();
         await givenUser.save()
    } catch {
    }
})

async function registerUser(tUser, callback) {

    try {
        const user = await User.findOne({telegramId: tUser.id})

        if (!user) {

            // Create new user
            const newUser = new User({
                userName: tUser.username,
                telegramId: tUser.id,
                points: 0,
                lastGivenPointsDate: 0,
                pointsToGive: 0,
            })

            await newUser.save()

            console.log("Created new user for " + tUser.username);
             if (callback) callback(`Je staat nu geregistreerd in ons systeem. Dit betekent dat jij G-Punten kan verdienen! ${CONFIG.EMOJI.POINTS}`)

            return;
        }

        console.log("already registered user")

        if (callback) callback(`Je staat al in ons systeem! ${CONFIG.EMOJI.POINTS}`)
    } catch (e) {
        console.log("Error while creating user " + tUser.username);
 
        console.log(e);

        if (callback) callback("Er ging iets mis tijdens het registreren, probeer het later nog eens!")
    }
}

async function getCurrentToken(tUser, callback, noUserCallback) {

    let user;

    try {
        user = await User.findOne({telegramId: tUser.id});

        if (!user) {
            noUserCallback("No user found, use /register")
            return;
        }

    } catch (e) {
        console.log(e)
    }

    const token = TokenCache.getTokenByUserId(user.id)

    if (callback) {
        if (token) callback(token, user)
        else callback(null, user)
    }
}

function canUserGivePoints(user, amount) {
    let lastGivenPointsDate = convertToDays(user.lastGivenPointsDate);
    let currentDate = convertToDays(new Date());

    if (currentDate.getTime() > lastGivenPointsDate.getTime()) { // Is it 1 day ago since player received points
        user.pointsToGive = CONFIG.MAX_POINTS_A_DAY;
        user.lastGivenPointsDate = currentDate;
    }

    return user.pointsToGive >= amount;
}

function sendMessage(telegramId, message) {
    tBot.sendMessage(telegramId, message);
}

function sendVariableMessage(telegramId, message, value) {
    const parts = message.split("%")

    if (parts.length !== 3) {
        throw new TypeError("Message contains no variables!")
    }

    sendMessage(telegramId, parts[0] + value + parts[2]);
}

function convertToDays(date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

bot.launch()

module.exports = { sendMessage, sendVariableMessage }