const { ApplicationCommandType } = require('discord.js');

module.exports = {
    name: 'smackass',
    description: 'Smack someone\'s ass.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Target of smack',
            type: 6,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const user = options.getUser('user');

        interaction.reply({content: `${member} smacked ${user}'s tiny butt~`, files: ["https://media.tenor.com/IVOxJ3ZUtWgAAAAC/anime-ass-slap.gif"]});
    }
}