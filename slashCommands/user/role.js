const fetch = require("node-fetch");
const { isVerified, isAdmin } = require("../../function/roles");
const { mustVerify } = require("../../data/embeds");
const { ApplicationCommandType, EmbedBuilder, AttachmentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const moment = require('moment');
const { getDominantColorFromURL } = require("../../function/utils");
const con = require('../../function/db')

module.exports = {
    name: 'roles',
    description: 'Modify custom role.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'edit',
            description: `Edit your existing custom role`,
            type: 1,
        },
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const subCmd = options.getSubcommand();

        if(subCmd === 'edit'){
            const userRole = await getRole(member.id);
            console.log(member.displayAvatarURL({extension: 'png'}))
            if(userRole){
                const select = new StringSelectMenuBuilder()
                    .setCustomId('selectRoleEdit')
                    .setPlaceholder("What do you want to edit?")
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Role name")
                            .setDescription("Edit the role name to new one")
                            .setEmoji('📝')
                            .setValue('roleName'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel("Role color")
                            .setDescription("Edit role's color")
                            .setEmoji('🎨')
                            .setValue('roleColor')
                        
                    )

                const color = await getDominantColorFromURL(member.displayAvatarURL({extension: 'png'}))
                const row = new ActionRowBuilder()
                    .addComponents(select);

                const embed = new EmbedBuilder()
                    .setTitle(`Edit custom role`)
                    .setColor(color)
                    .setThumbnail(member.displayAvatarURL())
                    .setDescription(`What would you like to edit this time? Select below!`)
                    .setColor("Blurple");
                    
                const response = await interaction.reply({embeds: [embed], components: [row]});
            } else {
                const embed = new EmbedBuilder()
                    .setTitle(`Uh no...`)
                    .setDescription(`You are missing a custom role... You might need to create one first.`)
                    .setColor("Red");

                await interaction.reply({embeds: [embed]});
            }
        }

    }
}

async function getRole(userId){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM user_roles_custom WHERE user='${userId}'`, function (err, res){
            if(res.length > 0){
                resolve(res[0])
            } else {
                resolve(false)
            }
        })
    })
}