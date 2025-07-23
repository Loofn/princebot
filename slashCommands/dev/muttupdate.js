const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

const {isAdmin} = require('../../function/roles');
const { noPerms } = require('../../data/embeds');

module.exports = {
    name: 'botupdate',
    description: 'Update log for the bot',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'title',
            description: 'Title for the update',
            type: 3,
            required: true
        },
        {
            name: 'text',
            description: 'Update text, split with | to make new line',
            type: 3,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        if(await isAdmin(member.id)){
            let title = options.getString('title');
            let string = options.getString('text');
            string.replace(/\|/g, '\n');

            const embed = new EmbedBuilder()
                .setDescription(`## ${title}\n${string}`)
                .setFooter({text: `Any issues with the bot should be reported to Lofn!`, iconURL: guild.iconURL()})
                .setAuthor({name: `Update done by ${member.user.username}`, iconURL: `${member.displayAvatarURL()}`})

            const ch = guild.channels.cache.get('1233947079123013632');
            ch.send({embeds: [embed]}).then(async (msg) => {
                await interaction.reply({content: `Posted in: ${msg.url}`, embeds: [embed], ephemeral: true})
            })
            
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }
}