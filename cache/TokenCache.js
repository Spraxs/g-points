const TOKEN_MAX_AGE = 1000 * 60 * 10;

const crypto = require('crypto');

const tokens = [];

const TokenCache = {
    removeInActiveTokens: function() {
        if (tokens.length === 0) return;
    
        const currentDate = Date.now();

        const tokensToRemove = [];
    
        for (var i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.deathDate < currentDate) {
                tokensToRemove.push(i);
            }
        }

        for (var i = 0; i < tokensToRemove.length; i++) {
            tokens.splice(tokensToRemove[i], 1)
        }
    },
    
    getTokenByToken: function(givenToken) {
        if (tokens.length === 0) return;
    
        for (var i = 0; i < tokens.length; i++) {
            const token = tokens[i];
    
            if (token.token && token.token == givenToken) return token;
        }
    },

    getTokenByUserId: function(givenUserId) {
        if (tokens.length === 0) return;
    
        for (var i = 0; i < tokens.length; i++) {
            const token = tokens[i];
    
            if (token.userId && token.userId == givenUserId) return token;
        }
    },
    
    createToken: function (userId, callback) {

        try {
            crypto.randomBytes(32, (err, buf) => {
                if (err) throw err;
        
                let deathDate = Date.now();

                deathDate = deathDate += TOKEN_MAX_AGE
        
                const token = {
                    userId: userId,
                    token: buf.toString('hex'),
                    deathDate: deathDate,

                    keepAlive: function () {
                        var date = Date.now();

                        date += TOKEN_MAX_AGE

                        this.deathDate = date;
                    }
                };
        
                tokens.push(token);
            
                if (callback) callback(token);

                this.debugTokens();
            });

        } catch (e) {
            this.debugTokens();
        }
    },
    
    debugTokens: function() {
        console.log("TOKEN COUNT: " + tokens.length);

        if (tokens.length === 0) return;

        for (var i = 0; i < tokens.length; i++) {
    
            const token = tokens[i];
    
            console.log(token);
        }
    }
};

module.exports = TokenCache;