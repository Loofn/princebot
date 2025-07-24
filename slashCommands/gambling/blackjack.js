const { ApplicationCommandType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const serverRoles = require('../../data/serverRoles.json')
const con = require('../../function/db');
const moment = require('moment');
const { getPoints, removePoints } = require('../../function/furrygame');


module.exports = {
    name: 'blackjack',
    description: 'Play some blackjack with optional bet',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        
        {
            name: 'bet',
            description: 'Choose how many cumcoins you want to bet',
            type: 4,
            required: false,
            min_value: 1,
            max_value: 2000
        }

    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;


        const betAmount = options.getInteger('bet') ? options.getInteger('bet') : 0;

        const playerDie1 = rollDice();
        const playerDie2 = rollDice();

        const rollBtn = new ButtonBuilder()
            .setCustomId(`bjr-${member.id}-${sum(playerDie1, playerDie2)}`)
            .setLabel(`Roll more`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎲')
        
        const stayBtn = new ButtonBuilder()
            .setCustomId(`bjs-${member.id}-${sum(playerDie1, playerDie2)}`)
            .setLabel(`Stay`)
            .setEmoji('🖐️')
            .setStyle(ButtonStyle.Danger)

        const row = new ActionRowBuilder().addComponents(rollBtn, stayBtn)

        const gameEmbed = new EmbedBuilder()
            .setTitle(`Blackjack game of ${member.user.username}`)
            .setDescription(`Starting hand is: \`${sum(playerDie1, playerDie2)}\`\nBet amount: \`${betAmount} cumcoins\` <a:Lewd_Coom:1235063571868680243>\n\n**Good luck** :pray:`)
            .setFooter({text: `Winnings are x2 the bet amount`, iconURL: interaction.guild.iconURL()})

        if(betAmount == 0){
            interaction.reply({embeds: [gameEmbed], components: [row]});
        } else {
            const pointBalance = await getPoints(member.id);

            if(pointBalance >= betAmount){
                removePoints(member.id, betAmount);
                interaction.reply({embeds: [gameEmbed], components: [row]});
            } else {
                const notEnoughPoints = new EmbedBuilder()
                    .setTitle(`Not enough cum to play...`)
                    .setColor("DarkRed")
                    .setDescription(`You attempted to gamble \`${betAmount} cumcoins\` but you have \`${pointBalance} cumcoins\`.. The math does not math dear`)
                    .setThumbnail(`https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ256eGxzaHg1eDQwNnZodncyMzB6MDdqaW5qNzZoNmFycWlxNjNsdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cRHgphdnVZMtRLZlT1/giphy.gif`)
            
                await interaction.reply({embeds: [notEnoughPoints]}).then(msg => {
                    setTimeout(() => {
                        msg.delete()
                    }, 10000);
                })
            }
        }
    }
}

const rollDice = () => Math.floor(Math.random() * 6) + 1;

const sum = (...numbers) => {
    return numbers.reduce((total, num) => total + num, 0);
}