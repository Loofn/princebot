const { ApplicationCommandType } = require('discord.js');

module.exports = {
    name: 'bonk',
    description: 'Make someone go to hornijail.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Target of bonk',
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
        interaction.reply({content: `${member} bonked ${user}, *go to hornijail!*`, files: ["https://media.tenor.com/Tg9jEwKCZVoAAAAd/bonk-mega-bonk.gif"]});
    }
}