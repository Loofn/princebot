const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin, isTrialMod } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');

module.exports = {
    name: 'verify',
    description: 'Verify user, granting them access to the server.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Who are we verifying?',
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


        if(await isTrialMod(member.id) || await isMod(member.id) || await isAdmin(member.id)){
            const verifyUser = await guild.members.fetch(options.getUser('user').id, {force: true, cache: true});
            if(verifyUser.user.bot){
                const noBots = new EmbedBuilder()
                    .setTitle(`Can't verify bot accounts`)
                    .setDescription(`We can't verify bot accounts, because that would be dumm, right?`)
                    .setColor("Red")

                return await interaction.reply({embeds: [noBots], ephemeral: true})
            }
            if(!verifyUser.roles.cache.get(serverRoles.verified)){
                await verifyUser.roles.remove([serverRoles.unverified, serverRoles.jailrole]).catch();
                await verifyUser.roles.add([serverRoles.member, serverRoles.verified]);
                const logChannel = guild.channels.cache.get(serverChannels.moderation)

                const verified = new EmbedBuilder()
                .setTitle(`Member has been verified!`)
                .setDescription(`${verifyUser} has been successfully verified to be over 18 years old by ${member}`)
                .setColor("Green")

                const verifyLog = new EmbedBuilder()
                .setTitle(`User verified`)
                .setColor("DarkButNotBlack")
                .setThumbnail(verifyUser.user.displayAvatarURL())
                .setDescription(`${member} has verified ${verifyUser} successfully`)
                .addFields(
                    {name: `Verified user`, value: `${verifyUser}\nID:\`${verifyUser.id}\``, inline: true},
                    {name: `Moderator`, value: `${member}\nID:\`${member.id}\``, inline: true}
                )
                logChannel.send({embeds: [verifyLog], ephemeral: true});
                interaction.reply({embeds: [verified]});
            } else {
                const alreadyVerified = new EmbedBuilder()
                    .setTitle(`User already verified!`)
                    .setDescription(`It would appear that the user is already verified in the server and they have the <@&${serverRoles.verified}> role.`)
                    .setColor("Red")
                
                await interaction.reply({embeds: [alreadyVerified], ephemeral: true, flags: [MessageFlags.SuppressNotifications]})
            }
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }
}