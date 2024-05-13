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
        if(userId === '1223325333168848898'){
            msg.reply(`Hi babushka, did you bake me cookies? They better be chocolate chip or I am eating it out of your ass`)
            msg.react('🍪')
        }
        else if(userId === '560112855026761789'){
            msg.reply(`<a:Furr_cum:1233559991433297921> Oh so you are getting dominated by the same floof derg? How pathetic of us... `)
            msg.react('🍆')
        }
        else if(userId === '526467575673257995'){
            msg.reply(`38 shots? I can do 69... bitch!`)
            msg.react('🍺')
        }
        else if(userId === '1008967621766557819'){
            msg.reply(`What dat ass do?! FUCKING HOT!`)
            msg.react('🍑')
        }
        else if(userId === '102756256556519424'){
            msg.reply(`Hi daddy!`)
            msg.react('💗')
        }
        else if(userId === '1219436982695100466'){
            msg.reply(`Hi there, I heard you like being naughty in cons... can I join you? You can use me behind the corner..!`)
            msg.react('💦')
        }
        else {
            var i = Math.floor(Math.random() * randomResponses.length);
            msg.reply(randomResponses[i])
        }
    }

});