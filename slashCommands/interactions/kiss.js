const { ApplicationCommandType } = require('discord.js');

module.exports = {
    name: 'smooch',
    description: 'Smooch somone.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Target of smooch',
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
        const kisses = ["https://media.tenor.com/jnndDmOm5wMAAAAC/kiss.gif", "https://gifdb.com/images/thumbnail/shocking-anime-kiss-stance-wn7wgnegs4xzc49w.gif", "https://media.tenor.com/6N4fuTkgpRIAAAAC/enage-kiss-anime-kiss.gif", "https://media.tenor.com/IzoHEmuz3u8AAAAd/anime-kiss.gif", "https://pa1.aminoapps.com/6248/a62db6fa883b21bf305a1d361fee29892b0db1ed_hq.gif"]
        const randomKiss = kisses[Math.floor(Math.random() * kisses.length)]
        interaction.reply({content: `${member} smooched ${user}, how cute~ ^^`, files: [randomKiss]});
    }
}