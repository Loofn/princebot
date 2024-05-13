const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

const {isAdmin} = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const { storeOldUsers } = require('../../function/entrance');

module.exports = {
    name: 'storeusers',
    description: 'Store missing users data to database',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        if(await isAdmin(member.id)){

            await interaction.reply({content: `Storing old users...`, ephemeral: true});


            const num = await storeOldUsers()

            await interaction.editReply({content: `Storing old users...DONE`})
            
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }
}