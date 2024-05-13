const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

const {isAdmin} = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const { isImageLink, getDominantColorFromURL } = require('../../function/utils');
const con = require('../../function/db');
const { sendFurry } = require('../../events/petfurry');

module.exports = {
    name: 'spawnfurry',
    description: 'Spawn furry to the game',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        if(await isAdmin(member.id)){
            sendFurry()
            await interaction.reply({content: `Spawned new furry to <#1236764013967446016>`})
        } else {
            await interaction.reply({ embeds: [noPerms], ephemeral: true });
        }
        
    }
}