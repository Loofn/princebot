const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin, isStaff } = require('../../function/roles');
const { noPerms, cantPunishStaff } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const { addModlog } = require('../../function/modlog');
const con = require('../../function/db')

module.exports = {
    name: 'ban',
    description: 'Ban user from the server.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to ban',
            type: 6,
            required: true
        },
        {
            name: `reason`,
            description: `Reason for the ban`,
            type: 3,
            required: true
        },
        {
            name: `dm`,
            description: `Should user be DM'd about the ban`,
            type: 5,
            required: false
        },
        {
            name: `softban`,
            description: `Immediately unban the user after ban`,
            type: 5,
            required: false
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const userToBan = options.getUser('user');
        const reason = options.getString('reason');
        const dm = options.getBoolean('dm');
        const softban = options.getBoolean('softban');

        if(await isMod(member.id) || await isAdmin(member.id)){
            if(!await isStaff(userToBan.id)){
                addModlog(userToBan.id, "BAN", member.id, reason);

                const banOptions = { reason: `Banned for [${reason}] by ${member.user.username}` };

                if (dm || dm === undefined || dm === null) {
                    const dmUser = new EmbedBuilder()
                        .setTitle(`You were banned!`)
                        .setDescription(`You have been banned from **${guild.name}** for ${reason}.`);

                    userToBan.send({ embeds: [dmUser] }).catch(error => {
                        console.error(`Failed to send message to user ${userToBan.id}:`, error);
                    });
                }

                if (guild.members.cache.has(userToBan.id)) {
                    await guild.members.ban(userToBan, banOptions).catch(console.error);
                } else {
                    // If user is not in the server, ban them directly
                    await guild.bans.create(userToBan.id, banOptions).catch(console.error);
                }

                if (softban) {
                    await guild.bans.remove(userToBan.id, { reason: `Softban by ${member.user.username}` }).catch(console.error);
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Member banned`)
                    .setDescription(`${member} permanently banned ${userToBan} for '${reason}'.`)
                    .setColor("DarkRed")
                    .setImage('https://d.furaffinity.net/art/sharkcatsg/1597955617/1597955599.sharkcatsg_bonk.gif');

                const log = new EmbedBuilder()
                    .setTitle(`${softban ? `Softban added` : `Ban added`}`)
                    .setThumbnail(userToBan.displayAvatarURL())
                    .setTimestamp()
                    .setColor("DarkRed")
                    .addFields(
                        { name: `Banned user`, value: `\`${userToBan.username}\``, inline: true },
                        { name: `Banned user ID`, value: `\`${userToBan.id}\``, inline: true },
                        { name: `Reason`, value: `${reason}`, inline: true },
                        { name: `Moderator`, value: `${member}` }
                    );

                const logs = guild.channels.cache.get(serverChannels.moderation);
                await logs.send({ embeds: [log] });
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [cantPunishStaff], ephemeral: true });
            }
        } else {
            await interaction.reply({ embeds: [noPerms], ephemeral: true });
        }
    }
}