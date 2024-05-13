const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin, isVIP } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const con = require('../../function/db');
const moment = require('moment');

module.exports = {
    name: 'Lofn nutted',
    type: ApplicationCommandType.Message,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        await interaction.deferReply({ephemeral: true})

        if(await isAdmin(member.id)){

                const targetMessage = interaction.targetMessage;
                // DEBUG console.log(targetMessage);
                con.query(`SELECT * FROM stats WHERE user='${targetMessage.author.id}' AND name='nutcount'`, async function (err, res){
                    let nutcount = 1;
                    if(res.length > 0){
                        nutcount = await res[0].value+1;
                        con.query(`UPDATE stats SET value=value+1 WHERE user='${targetMessage.author.id}' AND name='nutcount'`);
                    } else {
                        con.query(`INSERT INTO stats VALUES ('${targetMessage.author.id}', 'nutcount', '1')`)
                    }
                    
                    let exposedMsg = new EmbedBuilder()
                    .setAuthor({name: `${targetMessage.author.globalName} made Lofn nut`, iconURL: targetMessage.author.displayAvatarURL()})
                    .setDescription(`💦💦 *Fuuuckkghhh...*\n*${targetMessage.author} has made Lofn nut ${nutcount} time(s)*\n\n${targetMessage.content}`)
                    .setFooter({text: `Lofn has nutted to this one... ${moment(targetMessage.createdTimestamp).format("DD/MM/YYYY")}`})
                    .addFields(
                        {name: `Jump to message`, value: `${targetMessage.url}`, inline:true}
                    )
    
                    const exposedCh = guild.channels.cache.get('1234183271215005887');

                    if (targetMessage.attachments.size > 0 && !targetMessage.author.bot) {
                        exposedMsg.setImage(targetMessage.attachments.first().url)
                        exposedCh.send({embeds: [exposedMsg]}).then(() => {
                            exposedCh.send({content: `${targetMessage.author}`}).then(msg => {
                                setTimeout(() => {
                                    msg.delete()
                                }, 2000);
                            })
                        })

                    } else {
                        exposedCh.send({embeds: [exposedMsg]}).then(() => {
                            exposedCh.send({content: `${targetMessage.author}`}).then(msg => {
                                setTimeout(() => {
                                    msg.delete()
                                }, 2000);
                            })
                        })
                    }              
        
                    
                    await interaction.editReply({content: `DONE!`})
                })
                
            
        } else {
            await interaction.editReply({embeds: [noPerms]})
        }
    }
}