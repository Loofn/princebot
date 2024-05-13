const { ApplicationCommandType, EmbedBuilder } = require("discord.js");
const { isTrialMod, isMod, isAdmin } = require("../../function/roles");
const { noPerms } = require("../../data/embeds");
const serverRoles = require('../../data/serverRoles.json');
const { saveUserRoles } = require("../../function/userRoles");
const moment = require('moment');
const con = require('../../function/db');

module.exports = {
    name: 'Send to Kindergarten',
    type: ApplicationCommandType.User,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp, targetMember, targetUser
        } = interaction; 
        const { guild } = member;

        if(await isTrialMod(member.id) || await isMod(member.id) || await isAdmin(member.id)){

            if(targetMember.roles.cache.get(serverRoles.unverified) || targetMember.roles.cache.get(serverRoles.jailrole)){
                return interaction.reply({content: `The person is already in kindergarten or muzzled...`})
            }

            const sent = new EmbedBuilder()
                .setTitle(`Suspected minor has been kicked to Kindergarten!!`)
                .setDescription(`${member} sent ${targetMember} to <#1233466742148300984>! *eek!*\n\n:warning: **DO NOT** interact with them. They won't be seeing any other channel than <#1233466742148300984> and they will be removed from the server if they don't age verify.`)
                .setColor("Random")
                .setImage(`https://d.furaffinity.net/art/-babyfursyrik-/1646219906/1646219906.-babyfursyrik-_%D1%80%D0%B5%D0%B1%D0%B5%D0%BD%D0%BE%D0%BA_%D1%8E%D1%87_deebu.gif`)
            interaction.reply({embeds: [sent]}).then(msg => {
                setTimeout(() => {
                    msg.delete().catch(console.error);
                }, 10000);
            }).catch(console.error)

            await saveUserRoles(targetUser.id);
            await targetMember.roles.set([serverRoles.unverified]);
            const newTime = moment().add(24, 'hours').format('YYYY-MM-DD HH:mm:ss');
            con.query(`INSERT INTO kindergarten VALUES ('${targetUser.id}', '${newTime}')`)

        } else {
            return interaction.reply({embeds: [noPerms]})
        }
    }
}