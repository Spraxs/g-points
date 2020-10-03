const { Telegraf } = require('telegraf')
const Telegram = require('telegraf/telegram')
const tgresolve = require("tg-resolve");
const points = '💯';

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
    const user = ctx.update.message.from;
    registerUser(user, (message) => {
        tBot.sendMessage(user.id, message);
    })
})

bot.command('rewards', async (ctx) => {
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

    let name = message.split('@')[1].split(' ')[0];

    const chatType = ctx.update.message.chat.type;
    const chatId = ctx.update.message.chat.id;

    if (chatType !== 'supergroup') return;
    if (!message.includes(points)) return;

    if (name.includes(points)) name = name.split(emoji)[0]; 


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

        tBot.sendMessage(givenUser.telegramId, "Je hebt een g-punt onvangen! " + `${points}`)
        
         console.log("Found user " + givenUser.userName);

         givenUser.points++;

         console.log(givenUser.userName + " now has " + givenUser.points);

         await givenUser.save()
    } catch {
    }
})

async function registerUser(tUser, callback) {

    try {
        const user = await User.findOne({telegramId: tUser.id})
        
         console.log(user);

        if (!user) {

            // Create new user
            const newUser = new User({
                userName: tUser.username,
                telegramId: tUser.id,
                points: 0,
                lastGivenPointDate: 0,
                pointsToGive: 0,
            })

            await newUser.save()

            console.log("Created new user for " + tUser.username);
             if (callback) callback(`Je staat nu geregistreerd in ons systeem. Dit betekent dat jij G-Punten kan verdienen! ${points}`)

            return;
        }

        console.log("already registered user")

        if (callback) callback(`Je staat al in ons systeem! ${points}`)
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
            noUserCallback("No user found, register first!")
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

bot.launch()

module.exports = { sendMessage, sendVariableMessage }