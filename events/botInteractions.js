const client = require('..');

client.on('messageCreate', async msg => {
    const message = msg.content.toLowerCase()
    const userId = msg.author.id;
    const randomResponses = ["Who the fuck are you?", "Who?", "Excuse me *ugly*... I don't speak to strangers..", "*ignores*", "Eat my d*ck!", "You smell like a 3rd degree simp..", "If I don't bother you, will you also not bother me, deal?", "If you have 3 quarters, 4 dimes, and 4 pennies, you have $1.19. You also have the largest amount of money in coins without being able to make change for a dollar.", "The roar that we hear when we place a seashell next to our ear is not the ocean, but rather the sound of blood surging through the veins in the ear. Any cup-shaped object placed over the ear produces the same effect.", "Did you know, Kansas state law requires pedestrians crossing the highways at night to wear tail lights."];
    
    if(message.startsWith("stfu mutt")){
        msg.reply(`Please make me.... <a:cattongue:1235220627237900400>`)
        msg.react('<a:cattongue:1235220627237900400>')
    }

    if(message.startsWith("*pats mutt*")){
        msg.react('💕')
    }
    if(message.startsWith("hi mutt")){

        await msg.channel.sendTyping();
        setTimeout(() => {
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
            // Auron
            else if(userId === '1189105814284279911'){
                msg.reply(`Proton goes beep boop, you freaking toaster!`)
                msg.react('🍞')
            }
            //Vidraal
            else if(userId === '1091590806026063963'){
                msg.reply(`Heyo, I know your favorite channel is... <#1233561577920401429> you should post more...`)
                msg.react('🔞')
            }
            //Artemis
            else if(userId === '981199212165353493'){
                msg.reply(`Hi Artemis! I.. ugh.. mean Freya! or was it Lillith, dear god I can't keep up with chu!`)
                msg.react('<a:Ducky_Bonk:1239654615746871317>')
            }
            //Purp the possum
            else if(userId === '692819267623583775'){
                msg.reply(`I heard you tried to pin my daddy down once, well how did that go *"big boy*"?`)
                msg.react('<:Catto_Cummies:1236761878365999115>')
            }
            // Louei
            else if(userId === '957024898126061688'){
                msg.reply(`*Steals your fiance* Mine now, I will stuff this bitch to the brim, and you can't do nothing about it`)
                msg.react('<a:Lewd_GayHotDog:1232435863166648401>')
            }
            // Hunter
            else if(userId === '1110651119916552263'){
                msg.reply(`Hey there, wanna drink 10 cans of monster and bang boys with our monsters?`)
                msg.react('<a:Pepe_Eat:1235223653969559702>')
            }
            // Felix
            else if(userId === '1163330846862884944'){
                msg.reply(`Hey, wanna gather some ice cubes and push them in.... you? That is normal otter activity, right?`)
                msg.react('🧊')
            }
            else {
                var i = Math.floor(Math.random() * randomResponses.length);
                msg.reply(randomResponses[i])
            }
        }, 4000);
        
    }

});