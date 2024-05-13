const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

const {isAdmin} = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const { isImageLink, getDominantColorFromURL } = require('../../function/utils');
const con = require('../../function/db');
const { sendFurry, addToGame } = require('../../events/petfurry');

module.exports = {
    name: 'points',
    description: 'Check your game points',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        await addToGame(member.id);

        con.query(`SELECT * FROM user_points WHERE user='${member.id}'`, async function (err, res){
            
            const embed = new EmbedBuilder()
                .setDescription(`${member} has collected <a:coom:1235063571868680243> \`${res[0].points} cumcoins\``)
                .setColor("White")

            await interaction.reply({embeds: [embed]});
        })
        
    }
}