const client = require('..');

client.on('messageCreate', async msg => {
    const message = msg.content.toLowerCase()
    const userId = msg.author.id;
    const randomResponses = ["Who the fuck are you?", "Who?", "Excuse me *ugly*... I don't speak to strangers..", "*ignores*", "Eat my d*ck!"];

    if(message.startsWith("stfu mutt")){
        msg.reply(`Please make me.... <a:cattongue:1235220627237900400>`)
        msg.react('<a:cattongue:1235220627237900400>')
    }

    if(message.startsWith("*pats mutt*")){
        msg.react('💕')
    }
    if(message.startsWith("hi mutt")){
        // Red
        if(userId === '1008967621766557819'){
            msg.reply(`What dat ass do?! FUCKING HOT!`)
            msg.react('🍑')
        }
        // Lofn
        else if(userId === '102756256556519424'){
            msg.reply(`Hi daddy!`)
            msg.react('💗')
        }
        // Dice
        else if(userId === '1252440817310896211'){
            msg.reply(`Hi stinky, I might be a doggo but you are the real mutt *swinging rope ready to pin down the lion*`)
            msg.react('<:Catto_UvU:1236762320248766484>')
        }
        // Danny
        else if(userId === '1241864422834569298'){
            msg.reply(`Hi dandan, can you switch bleach into my coom? It is way more healthier..`)
            msg.react('<a:Lewd_CockCum:1233559991433297921>')
        }
        // Anon
        else if(userId === '627949692894052369'){
            msg.reply(`Hi ${msg.author}, I know what you did with Lofn... naughty naughty little princess!`)
            msg.react('<a:Fox_Blush:1238204170645930014>')
        }
        // Winter
        else if(userId === '213152760726552576'){
            msg.reply(`*Shows sharp teeth at ${msg.author}* You know what these do...?`)
            msg.react('🩸')
        }
        // Alice
        else if(userId === '908024462312611840'){
            msg.reply(`Proton goes beep boop, you freaking toaster!`)
            msg.react('🍞')
        }
        //Vidraal
        else if(userId === '1091590806026063963'){
            msg.reply(`Heyo, I know your favorite channel is... <#1233561577920401429> you should post more...`)
            msg.react('🔞')
        }
        else {
            var i = Math.floor(Math.random() * randomResponses.length);
            msg.reply(randomResponses[i])
        }
    }

});