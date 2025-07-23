const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = require('..');

const {noPerms} = require('../data/embeds');
const serverRoles = require('../data/serverRoles.json')
const serverChannels = require('../data/channels.json')
const { isBooster } = require('../function/roles');
const { givePoints } = require('../function/furrygame');

client.on('interactionCreate', async interaction => {

    if(interaction.isButton()){

        // Blackjack interactions / playing
        if(interaction.customId.toLowerCase().startsWith("bj")){

            const options = interaction.customId.split('-');
            const action = options[0];
            const playerId = options[1];
            const currentDice = options[2];

            if(playerId !== interaction.member.id) {
                return interaction.reply({content: `This is not your game... dummy...`, ephemeral: true})
            }

            let oldEmbed = interaction.message.embeds[0];
            const betAmountMatch = oldEmbed.description.match(/Bet amount: \`(\d+)/)
            const betAmount = parseInt(betAmountMatch[1], 10);

            const handMatch = oldEmbed.description.match(/(Starting|Current) hand is: \`(\d+)/);
            const currentHand = parseInt(handMatch[2], 10);

            const hasBoosterRole = await isBooster(interaction.member.id);
            let winnings = betAmount;
            if(hasBoosterRole) {
                winnings = Math.floor(winnings + winnings * 1.75);
            } else {
                winnings = Math.floor(winnings + winnings * 1.25);
            }

            if(action === 'bjr'){

                const newDice = rollDice();
                const newSum = sum(currentHand, newDice);

                if(newSum > 21){
                    const busted = new EmbedBuilder()
                        .setTitle(`Oh no ${interaction.member.user.username} BUSTED their loadd..`)
                        .setDescription(`**You threw:** \`${newDice}\` :game_die:\nBusted hand is: \`${newSum}\`\nLost bet amount is: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>`)
                        .setThumbnail(`https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmlqM204MG1ieTl2MDU1czJjejY4aWlpdmZ2OXc4eGY4OG9zN2JrMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1aFfcTbMqVI52/giphy.gif`)
                        .setColor("Red")

                    interaction.message.edit({embeds: [busted], components: []}).then(() => {
                        interaction.reply({content: `You **BUSTED**!! *moans* well.. better luck next time!`, ephemeral: true})
                    })
                } else if(newSum == 21) {
                    const blackJack = new EmbedBuilder()
                        .setTitle(`${interaction.member.user.username} scored a fking BLACKJACK!`)
                        .setColor("Gold")
                        .setThumbnail(`https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjNuN2Ixd2JscTZja3AyZXBxNTB2c2FsaGJ2a3gxa2tkNWo2YTB4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PIdyzBZ8XiKQWfgwYk/giphy.gif`)
                        .setDescription(`**You threw:** \`${newDice}\` :game_die:\nCurrent hand is: \`${newSum}\`\nBet amount was: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>\n\n**You won:** \`${winnings} cumcoins\` <a:Lewd_Coom:1235063571868680243>`)
                    
                    interaction.message.edit({embeds: [blackJack], components: []}).then(() => {
                        interaction.reply({content: `You **WON**!! *moans*!`, ephemeral: true})
                    })
                    givePoints(interaction.member.id, winnings);

                } else {
                    const newEmbed = new EmbedBuilder()
                    .setTitle(oldEmbed.title)
                    .setFooter({text: `Winnings are x1.25 for regulars, and x1.75 for server boosters`, iconURL: interaction.guild.iconURL()})
                    .setDescription(`**You threw:** \`${newDice}\` :game_die:\nCurrent hand is: \`${newSum}\`\nBet amount: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>`)

                    interaction.message.edit({embeds: [newEmbed]}).then(() => {
                        interaction.reply({content: `You **threw ${newDice}**!`, ephemeral: true})
                    })
                }

                
            }

            if(action === 'bjs'){
                await interaction.deferReply({ephemeral: true});
                let dealerTotal = sum(rollDice(), rollDice());

                let stayEmbed = new EmbedBuilder()
                    .setTitle(`${interaction.member.user.username} decided to stay!`)
                    .setDescription(`**You stayed!** 🖐️\n\nCurrent hand is: \`${currentHand}\`\nBet amount is: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>`)
                    .addFields(
                        {name: `Dealer throwing...`, value: `:game_die: Rolled: \`${dealerTotal}\``}
                    )
                await interaction.message.edit({embeds: [stayEmbed], components: []})
                await new Promise((resolve) => setTimeout(resolve, 2000));

                while (dealerTotal < 17){
                    const newRoll = rollDice()
                    dealerTotal += newRoll;
                    stayEmbed.addFields({name:`** **`, value: `\n:game_die: Rolled: \`+${newRoll}\` (\`${dealerTotal}\`)`}) 

                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    await interaction.message.edit({embeds: [stayEmbed]});
                }

                if(dealerTotal > 21) {
                    // WIN
                    const wonGame = new EmbedBuilder()
                        .setTitle(`${interaction.member.user.username} won! Dealer busted ~~a nut~~`)
                        .setColor("Gold")
                        .setThumbnail(`https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjNuN2Ixd2JscTZja3AyZXBxNTB2c2FsaGJ2a3gxa2tkNWo2YTB4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PIdyzBZ8XiKQWfgwYk/giphy.gif`)
                        .setDescription(`**You stayed!** 🖐️\n\nCurrent hand is: \`${currentHand}\`\nDealer's hand is: \`${dealerTotal}\`\nBet amount was: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>\n\n**You won:** \`${winnings} cumcoins\` <a:Lewd_Coom:1235063571868680243>`)
                    
                    interaction.message.edit({embeds: [wonGame], components: []}).then(() => {
                        interaction.editReply({content: `You **WON**!! *moans*`, ephemeral: true})
                    })
                    givePoints(interaction.member.id, winnings);
                } else if (currentHand > dealerTotal) {
                    // WIN
                    const wonGame = new EmbedBuilder()
                        .setTitle(`${interaction.member.user.username} won! Dealer busted ~~a nut~~ faster`)
                        .setColor("Gold")
                        .setThumbnail(`https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjNuN2Ixd2JscTZja3AyZXBxNTB2c2FsaGJ2a3gxa2tkNWo2YTB4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PIdyzBZ8XiKQWfgwYk/giphy.gif`)
                        .setDescription(`**You stayed!** 🖐️\n\nCurrent hand is: \`${currentHand}\`\nDealer's hand is: \`${dealerTotal}\`\nBet amount was: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>\n\n**You won:** \`${winnings} cumcoins\` <a:Lewd_Coom:1235063571868680243>`)
                    
                    interaction.message.edit({embeds: [wonGame], components: []}).then(() => {
                        interaction.editReply({content: `You **WON**!! *moans*`, ephemeral: true})
                    })
                    givePoints(interaction.member.id, winnings);
                } else if (currentHand == dealerTotal){
                    // TIE
                    const wonGame = new EmbedBuilder()
                        .setTitle(`${interaction.member.user.username} and dealer were both on the edge...`)
                        .setColor("Gold")
                        .setThumbnail(`https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGlrYndiNjM0aHh6YTR2MTVpb2F3NDBtcTZwdTkwbTVkMmg1NmNpMSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/y4Cu1f9QFs8K1XHFws/giphy.gif`)
                        .setDescription(`**You stayed!** 🖐️\n\nCurrent hand is: \`${currentHand}\`\nDealer's hand is: \`${dealerTotal}\`\nBet amount was: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>\n\n**You won:** \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>`)
                    
                    interaction.message.edit({embeds: [wonGame], components: []}).then(() => {
                        interaction.editReply({content: `You tied... which means you got nothing...`, ephemeral: true})
                    })
                    givePoints(interaction.member.id, betAmount);
                } else {
                    // LOSE
                    const wonGame = new EmbedBuilder()
                        .setTitle(`${interaction.member.user.username} busted all over the Dealer; Dealer wins!`)
                        .setColor("Gold")
                        .setThumbnail(`https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMjNuN2Ixd2JscTZja3AyZXBxNTB2c2FsaGJ2a3gxa2tkNWo2YTB4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PIdyzBZ8XiKQWfgwYk/giphy.gif`)
                        .setDescription(`**You stayed!** 🖐️\n\nCurrent hand is: \`${currentHand}\`\nDealer's hand is: \`${dealerTotal}\`\nBet amount was: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243> *and you lost all of it...*`)
                    
                    interaction.message.edit({embeds: [wonGame], components: []}).then(() => {
                        interaction.editReply({content: `You **LOST**!! *cries*`, ephemeral: true})
                    })
                }
            }
            
        } else return;
    }
})

const rollDice = () => Math.floor(Math.random() * 6) + 1;

const sum = (...numbers) => {
    return numbers.reduce((total, num) => total + num, 0);
}