const { ApplicationCommandType, EmbedBuilder } = require("discord.js");
const { isTrialMod, isMod, isAdmin } = require("../../function/roles");
const { noPerms } = require("../../data/embeds");
const serverRoles = require('../../data/serverRoles.json');
const { saveUserRoles } = require("../../function/userRoles");
const moment = require('moment');
const con = require('../../function/db');
const { isIDList } = require("../../function/utils");

module.exports = {
    name: 'springclean',
    description: 'Send multiple users to Kindergarten',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: `users`,
            description: `IDs of the users you want to send to kindergarent seperated with comma`,
            type: 3,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp, targetMember, targetUser
        } = interaction; 
        const { guild } = member;

        let usersList = options.getString('users');

        if(!isIDList(usersList)){
            return interaction.reply({content: `You need to provide list of IDs with comma seperating them, no spaces!`, ephemeral: true})
        }

        if(await isAdmin(member.id)){
            await interaction.deferReply();
            let idList = usersList.split(',');
            let failedRoles = 0;
            let includingMembersString = `Following people were sent there:\n\n`;
            console.log(idList.length);

            for (let i = 0; i < idList.length; i++) {
                let targetMember = guild.members.cache.get(idList[i]);
                
                if(targetMember.roles.cache.get(serverRoles.unverified) || targetMember.roles.cache.get(serverRoles.jailrole)){
                    failedRoles++;
                    continue;
                }
                
                await saveUserRoles(targetMember.id);
                await targetMember.roles.set([serverRoles.unverified]);

                const newTime = moment().add(24, 'hours').format('YYYY-MM-DD HH:mm:ss');
                con.query(`INSERT INTO kindergarten VALUES ('${targetMember.id}', '${newTime}')`)

                includingMembersString += `${targetMember}\n`
            }

            const embed = new EmbedBuilder()
                .setTitle(`Some spring cleaning was done...`)
                .setDescription(`${member} was doing some spring cleaning and found some *creatures...* that were thrown into Kindergarten.\nTotal of \`${idList.length}\` new residents were assigned there!!`)
                .setImage('https://64.media.tumblr.com/6a8c00ba4946962b6039fb806f8e6b53/tumblr_n0epokv1441s5s0umo1_500.gif')
                .setColor("DarkButNotBlack");

            const includingMembers = new EmbedBuilder()
                .setDescription(`${includingMembersString}`)
                .setColor("DarkButNotBlack")
                .setFooter({text: `DO NOT interact with them. They will be removed from the server if they don't age verify.`})

            await interaction.editReply({embeds: [embed, includingMembers]})
        } else {
            return interaction.reply({embeds: [noPerms]})
        }
    }
}