const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const { restoreUserRoles, saveUserRoles } = require('../../function/userRoles');
const { addModlog } = require('../../function/modlog');

module.exports = {
    name: 'purge',
    description: 'Delete messages in bulk.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'amount',
            description: 'Amount of messages to remove.',
            type: 4,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const amount = options.getInteger('amount') > 100 ? 100 : options.getInteger('amount');
        await interaction.deferReply({ephemeral: true})

        if(await isMod(member.id) || await isAdmin(member.id)){

            const messagesFetched = await interaction.channel.messages.fetch({limit: amount});

            await messagesFetched.forEach(msg => {
                msg.delete(`Bulk delete by ${member.user.username}`).catch();
            });

            let embed = new EmbedBuilder()
                .setTitle(`Messages purged`)
                .setDescription(`Message purge amount: \`${amount}\`\nMessages purged: \`${messagesFetched.size}\``)

            await interaction.editReply({embeds: [embed], ephemeral: true});
            const logs = guild.channels.cache.get(serverChannels.moderation);
            logs.send({embeds: [embed.addFields({name: `Moderator`, value: `${member}`, inline: true}, {name: `Channel`, value: `${interaction.channel}`, inline: true})]});

        } else {
            await interaction.editReply({embeds: [noPerms], ephemeral: true})
        }
    }
}