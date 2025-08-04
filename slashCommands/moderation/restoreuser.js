const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin, isTrialMod } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const { restoreUserRoles } = require('../../function/userRoles');
const { addModlog } = require('../../function/modlog');

module.exports = {
    name: 'restoreuser',
    description: 'Restores user\'s roles from database.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to restore roles to',
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

        if(await isTrialMod(member.id) ||await isMod(member.id) || await isAdmin(member.id)){
            const user = guild.members.cache.get(options.getUser('user').id);
            await restoreUserRoles(user.id);

            const embed = new EmbedBuilder()
                .setTitle(`Roles were restored to user`)
                .setDescription(`Roles from our database have been applied to the user.\n\n:warning: If there are no roles in database, they are not applied to them.`)
                .setColor("Greyple")

            const log = new EmbedBuilder()
                .setTitle(`User's roles were restored`)
                .setDescription(`${member} restored roles for ${user}, from database.`)
                .setTimestamp()
                .setColor("Greyple");

            addModlog(user.id, "USER RESTORED", member.id);
            const logchannel = guild.channels.cache.get(serverChannels.moderation)
            logchannel.send({embeds: [log]})

            interaction.reply({embeds: [embed], ephemeral: true})
        } else {
            interaction.reply({embeds: [noPerms], ephemeral: true})
        }
        
    }
}