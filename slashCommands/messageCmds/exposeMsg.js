const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin, isVIP } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const con = require('../../function/db');
const moment = require('moment');


module.exports = {
    name: 'Expose!',
    type: ApplicationCommandType.Message,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        await interaction.deferReply({ephemeral: true})

        if(await isMod(member.id) || await isAdmin(member.id) || await isVIP(member.id)){

            const targetMessage = interaction.targetMessage;
            con.query(`SELECT * FROM exposed WHERE message='${targetMessage.id}'`, async function (err, res){
                if(res.length === 0){
                    // DEBUG console.log(targetMessage);

                    const exposedMsg = new EmbedBuilder()
                        .setAuthor({name: `Message by ${targetMessage.author.globalName}`, iconURL: targetMessage.author.displayAvatarURL()})
                        .setDescription(`${targetMessage.content}`)
                        .setFooter({text: `Original message was sent to ${targetMessage.channel.name} - ${moment(targetMessage.createdTimestamp).format("DD/MM/YYYY")}`})
                        .addFields(
                            {name: `Exposed by`, value: `${interaction.member}`, inline: true},
                            {name: `Jump to message`, value: `${targetMessage.url}`, inline:true}
                        )
        
                    const exposedCh = guild.channels.cache.get('1233567502798295090');
                    exposedCh.send({embeds: [exposedMsg]}).then(() => {
                        exposedCh.send({content: `${targetMessage.author}`}).then(msg => {
                            setTimeout(() => {
                                msg.delete()
                            }, 2000);
                        })
                    })
        
                    await interaction.editReply({content: `DONE!`})
                    con.query(`INSERT INTO exposed VALUES ('${targetMessage.id}')`)
                } else {
                    await interaction.editReply({content: `Content has been exposed already...`})
                }
            })
            
        } else {
            await interaction.editReply({embeds: [noPerms]})
        }
    }
}