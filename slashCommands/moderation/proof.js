const { EmbedBuilder, ApplicationCommandType, Attachment, AttachmentBuilder } = require('discord.js');
const { isMod, isAdmin, isStaff, isTrialMod } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const fs = require('fs')
const fetch = require('node-fetch');
const { getModlogs } = require('../../function/modlog');
const moment = require('moment');
const con = require('../../function/db')

module.exports = {
    name: 'proof',
    description: 'Proof logging for the server.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'list',
            description: `List user's proof logs.`,
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'User to check',
                    type: 6,
                    required: true
                }
            ]
        },
        {
            name: 'show',
            description: `Show proof by ID.`,
            type: 1,
            options: [
                {
                    name: 'id',
                    description: 'ID of the proof',
                    type: 4,
                    required: true
                }
            ]
        },
        {
            name: 'add',
            description: `Add new proof relating to user`,
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'User to add proof about',
                    type: 6,
                    required: true
                },
                {
                    name: 'image',
                    description: 'Proof image',
                    type: 11,
                    required: true
                },
                {
                    name: 'description',
                    description: 'Add note or description to the proof',
                    type: 3,
                    required: false
                }
            ]
        },
        {
            name: 'delete',
            description: 'Remove proof from the database',
            type: 1,
            options: [
                {
                    name: 'id',
                    description: 'Proof ID',
                    type: 4,
                    required: true
                }
            ]
        }
        
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const subCmd = options.getSubcommand();
        if(await isAdmin(member.id) || await isMod(member.id) || await isTrialMod(member.id)){
            if(subCmd === 'add'){
                await interaction.deferReply({ephemeral: true});
                const proofUserId = options.getUser('user');
                const attachment = options.getAttachment('image');
                const desc = options.getString('description') ? options.getString('description') : "N/A";
                
                const response = await fetch(attachment.url);
                const buffer = await response.buffer()
                const fileExtension = attachment.contentType.split('/')[1];
                const fileName = `proof_${moment().format('YYYY-MM-DD_HH-mm-ss-SSS')}.${fileExtension}`
                const filePath = `data/proof/${fileName}`;
                fs.writeFileSync(filePath, buffer)

                const sql = `INSERT INTO proof (user, imageName, description, moderator) VALUES (?, ?, ?, ?)`;
                con.query(sql, [proofUserId.id, fileName, desc, member.id], async function (err, res){
                    if(res){

                        const done = new EmbedBuilder()
                            .setColor("Yellow")
                            .setTitle(`New proof added`)
                            .setTimestamp()
                            .setFooter({text: `Proof ID #${res.insertId}`, iconURL: guild.iconURL()})
                            .setDescription(`New proof added to the database for ${proofUserId} by ${member}`)
                            .setImage(attachment.url)
                        await interaction.editReply({embeds: [done], ephemeral: true})

                        const auditLogs = guild.channels.cache.get(serverChannels.auditlogs);
                        auditLogs.send({embeds: [done]});
                    }
                })
            }

            if(subCmd === 'delete'){
                const proofId = options.getInteger('id');
                await interaction.deferReply({ephemeral: true})
                con.query(`SELECT * FROM proof WHERE id='${proofId}'`, async function (err, res){
                    if(res.length > 0){
                        const attachment = new AttachmentBuilder(`data/proof/${res[0].imageName}`)
                        con.query(`DELETE FROM proof WHERE id=${id}`)
                        await interaction.editReply({content: `Proof \`#${proofId}\` deleted`, files: [attachment]}).then(() => {
                            fs.unlinkSync(`data/proof/${res[0].imageName}`)
                        })
                    } else {
                        await interaction.editReply({content: `No proof found with ID \`#${proofId}\``, ephemeral: true})
                    }
                })
            }

            if(subCmd === 'list'){
                await interaction.deferReply({ephemeral: true});
                const proofUserId = options.getUser('user');
                con.query(`SELECT * FROM proof WHERE user='${proofUserId.id}'`, async function (err, res){
                    if(res.length > 0){
                        let proofs = "*Dates are in format DD/MM/YYYY*\n\n";
                        

                        for (let i = 0; i < res.length; i++) {
                            const member = client.users.cache.get(res[i].moderator)
                            proofs += `${moment(res[i].date).format('DD/MM/YYYY')} \`#${res[i].id}\` by ${member}: ${res[i].description}\n\n`
                            
                        }

                        let embed = new EmbedBuilder()
                            .setTitle(`All proof of the user ${proofUserId.username}`)
                            .setColor("Blurple")
                            .setFooter({text: `Show the proof with command /proof show <id>`, iconURL: guild.iconURL()})
                            .setDescription(`${proofs}`)

                        await interaction.editReply({embeds: [embed]})
                    } else {
                        await interaction.editReply({content: `No proof found from user ${proofUserId}`, ephemeral: true})
                    }
                })
            }

            if(subCmd === 'show'){
                await interaction.deferReply({ephemeral: true});
                const proofId = options.getInteger('id');
                con.query(`SELECT * FROM proof WHERE id='${proofId}'`, async function (err, res){
                    if(res.length > 0){
                        const proofUser = client.users.cache.get(res[0].user);
                        const proofMod = client.users.cache.get(res[0].moderator);
                        const attachment = new AttachmentBuilder(`data/proof/${res[0].imageName}`)
                        const embed = new EmbedBuilder()
                            .setTitle(`Proof #${res[0].id} of ${proofUser.username}`)
                            .setDescription(`${res[0].description}`)
                            .addFields(
                                {name: `Moderator`, value: `${proofMod}`, inline: true},
                                {name: `Date`, value: `${moment(res[0].date).format("DD/MM/YYYY")}`, inline: true}
                            )
                            .setColor("Blurple")
                            .setImage(`attachment://${res[0].imageName}`)

                        await interaction.editReply({embeds: [embed], files: [attachment]});
                    } else {
                        await interaction.editReply({content: `No proof found with ID \`#${proofId}\``, ephemeral: true})
                    }
                })
            }
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }
}