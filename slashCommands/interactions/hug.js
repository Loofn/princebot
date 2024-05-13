const { EmbedBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    name: 'hug',
    description: 'Give a hug to someone.',
    cooldown: 10000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Who are you hugging?',
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

        const user = interaction.options.getUser('user');
        const hugs = ["https://media.tenor.com/kCZjTqCKiggAAAAC/hug.gif", "https://media.tenor.com/ZmMbIa4rjhMAAAAd/hug-anime.gif", "https://media.tenor.com/XREF0Th-UykAAAAC/anime-hug-hug.gif", "https://media.tenor.com/k_jtbGJ4PMwAAAAC/kitsune-upload-anime.gif"];
        const randomHug = hugs[Math.floor(Math.random() * hugs.length)]

        interaction.reply({content: `${member} holds tight on ${user}, aww~ ^^`, files: [randomHug]});

    }
}