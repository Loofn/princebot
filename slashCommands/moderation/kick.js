const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin, isStaff, isTrialMod } = require('../../function/roles');
const { noPerms, cantPunishStaff } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const { addModlog } = require('../../function/modlog');

module.exports = {
    name: 'kick',
    description: 'Kick user from the server.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to kick',
            type: 6,
            required: true
        },
        {
            name: `reason`,
            description: `Reason for the kick`,
            type: 3,
            required: false
        },
        {
            name: `dm`,
            description: `Should user be DM'd about the kick`,
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

        const userToKick = options.getUser('user');
        const reason = options.getString('reason') ? options.getString('reason') : "Ban Hammer Has Spoken!";
        const dm = options.getBoolean('dm');

        if(await isTrialMod(member.id) || await isMod(member.id) || await isAdmin(member.id)){
             if(!await isStaff(userToKick.id)){
                addModlog(userToKick.id, "KICK", member.id, reason);
                if (dm || dm === undefined || dm === null) {
                    const dmUser = new EmbedBuilder()
                        .setTitle(`You were kicked!`)
                        .setDescription(`You have been kicked from **${guild.name}** for ${reason}.`);
                
                    try {
                        await userToKick.send({ embeds: [dmUser] });
                    } catch (error) {
                        console.error(`Failed to send DM to ${userToKick.username}: ${error}`);
                        // Optionally, you can handle the error here, for example:
                        // await interaction.followUp({ content: `Failed to send DM to ${userToKick.username}.` });
                    }
                }
                await guild.members.kick(userToKick, {reason: `Kicked for [${reason}] by ${member.user.username}`}).then(async () => {
        
                });

                const embed = new EmbedBuilder()
                    .setTitle(`Member kicked`)
                    .setDescription(`${member} kicked ${userToKick} for ${reason}.`)
                    .setColor("DarkRed");

                const log = new EmbedBuilder()
                    .setTitle(`Member kicked`)
                    .setThumbnail(userToKick.displayAvatarURL())
                    .setTimestamp()
                    .setColor("DarkRed")
                    .addFields(
                        {name: `Kicked user`, value: `\`${userToKick.username}\``, inline: true},
                        {name: `Kicked user ID`, value: `\`${userToKick.id}\``, inline: true},
                        {name: `Reason`, value: `${reason}`, inline: true},
                        {name: `Moderator`, value: `${member}`}
                    )

                const logs = guild.channels.cache.get(serverChannels.auditlogs);
                await logs.send({embeds: [log]})
                await interaction.reply({embeds: [embed]})
             } else {
                await interaction.reply({embeds: [cantPunishStaff], ephemeral: true})
             }
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }
}