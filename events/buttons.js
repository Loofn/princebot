const { EmbedBuilder, ChannelType, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const client = require('..');
const con = require('../function/db')
const {defaultAvatar} = require('../function/sus')
const {isStaff} = require('../function/roles')
const {noPerms} = require('../data/embeds');
const { deleteVerifyThread } = require('../function/db/fetchAgeVerifyThread');
const serverRoles = require('../data/serverRoles.json')
const serverChannels = require('../data/channels.json');
const { saveUserRoles } = require('../function/userRoles');
const { getPoints, removePoints } = require('../function/furrygame');
const { fixNumber } = require('./countingGame');

client.on('interactionCreate', async interaction => {

    if(interaction.isButton()){
        const member = interaction.member;
        const customId = interaction.customId;
        const guild = interaction.member.guild;
        const splitId = customId.split('-');

        if(splitId[0] === 'saveCountingStreak'){
            const balance = await getPoints(member.id)
            console.log(balance)
            console.log(splitId[1])
            if(parseInt(balance) >= parseInt(splitId[1])){
                const msgFetch = await interaction.channel.messages.fetch({limit: 1});
                const latestMsg = msgFetch.first();

                if(latestMsg.author.bot && !latestMsg.embeds[0].title.startsWith("Streak")){
                    removePoints(member.id, parseInt(splitId[1]));
                    fixNumber(parseInt(splitId[1]));

                    const savedEmb = new EmbedBuilder()
                        .setTitle(`Streak has been saved!`)
                        .setDescription(`${member} paid \`${splitId[1]}\` cumcoins to save the streak. You can now continue the game like there was no fail at all!`)

                    interaction.reply({embeds: [savedEmb]});
                } else {
                    interaction.reply({content: `Game is going already... touche-`, ephemeral: true});
                }
            } else {
                interaction.reply({content: `Insufficient cumcoins!`, ephemeral: true})
            }
        }

        if(customId === 'ageverifybtn'){
            const kindergartenCh = guild.channels.cache.get('1233466742148300984');
            if(await kindergartenCh.threads.cache.find(th => th.name.endsWith(member.user.username))){
                return await interaction.reply({content: `You have open age verification thread already!`, ephemeral: true})
            }

            await saveUserRoles(member.id);
            await member.roles.add([serverRoles.unverified]);

            kindergartenCh.threads.create({
                name: `Age Verify: ${member.user.username}`,
                type: ChannelType.PrivateThread,
                invitable: false
            }).then(async (thread) => {
                await thread.members.add(member);
                await thread.members.add('102756256556519424')
                const modrole = guild.roles.cache.get(serverRoles.mod);
                const trialmodrole = guild.roles.cache.get('1231615507485163611');
                const modUsers = modrole.members;
                const trialmodusers = trialmodrole.members;

                modUsers.forEach(mod => {
                    thread.members.add(mod);
                });

                trialmodusers.forEach(mod => {
                    thread.members.add(mod);
                });

                const deleteThread = new ButtonBuilder()
                    .setCustomId(`deletethread-${member.id}`)
                    .setLabel("Delete thread")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🗑️')

                const verifyButton = new ButtonBuilder()
                    .setCustomId(`verifyage-${member.id}`)
                    .setLabel(`Verify Age`)
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✅')

                const row = new ActionRowBuilder()
                    .addComponents(verifyButton, deleteThread)

                const verifyGuidelines = new EmbedBuilder()
                    .setTitle(`Age Verification of ${member.user.username}`)
                    .setDescription(`Here is what we need you to do, to verify your age. Remember if you do not verify your age, you will be **banned** from the server.\n\n## Steps to verify\n:arrow_right: You need either birth certificate, driver's license or passport.\n\n:arrow_right: Take a picture of the ID of your choosing, blurr any information on it except **date of birth** and place it on top of the paper. Paper has to have the server name and today's date written to it.\n\nOnce you have sent the image, wait for <@&1231405365674115112> to verify you.`)
                    .setColor("LuminousVividPink")
                    .setImage('https://i.imgur.com/E8wPLE8.png')
                    .setTimestamp()
                    .setFooter({text: `Follow the guidelines above so you know what you are expected to do`, iconURL: guild.iconURL()})

                await thread.send({embeds: [verifyGuidelines], components: [row]});
                con.query(`INSERT INTO ageverify VALUES ('${member.id}', '${thread.id}') ON DUPLICATE KEY UPDATE thread='${thread.id}'`);

                await interaction.reply({content: `Your age verify has been opened in ${thread}!`, ephemeral: true})
            })
        }
        if(splitId[0] === 'acceptrules'){
            if(member.id === splitId[1]){
                await member.roles.add('1231406209613959208');
                await interaction.reply({content: `Welcome!!`, ephemeral: true})
                await interaction.message.delete();

                const welcomeMessage = new EmbedBuilder()
                .setTitle(`Please welcome our newest member!`)
                .setDescription(`Welcome to our little humble home of ${guild.name}, ${member}! We hope you have pleasent stay whether it is short or long.`)
                .setThumbnail(member.displayAvatarURL())
                .setImage(`https://media.tenor.com/fp95MOGA4fIAAAAj/kiss-furry.gif`)
                
                if(await defaultAvatar(member.id)){
                    
                    return

                } else {

                    const entrance = interaction.member.guild.channels.cache.get('1231619809675051008');
                    con.query(`UPDATE users SET isMember=1 WHERE user='${member.id}'`)
                    entrance.send({content: `<@&1233526354394218527>`, embeds: [welcomeMessage]}).then(msg => {
                        setTimeout(() => {
                            msg.delete().catch(console.error);
                        }, 300000); 
                    }).catch(console.error);
                }
            } else {
                interaction.reply({content: `This is not your button to press, mutt!`, ephemeral: true})
            }
        }

        if(splitId[0] === 'deletethread'){
            if(await isStaff(member.id)){

                const deleting = new EmbedBuilder()
                    .setDescription(`This thread is scheduled to be deleted in 10 seconds by ${member}`)
                    .setColor("Red")


                await interaction.reply({embeds: [deleting], ephemeral: false}).then(async () => {
                    setTimeout(() => {
                        deleteVerifyThread(splitId[1]).catch(err => console.error(err))
                    }, 10000);
                })
                //await deleteVerifyThread(splitId[1])
            } else {
                await interaction.reply({embeds: [noPerms], ephemeral: true})
            }
        }

        if(splitId[0] === 'verifyage'){
            if(await isStaff(member.id)){
                const verifyUser = await guild.members.cache.get(splitId[1]);
                await verifyUser.roles.remove([serverRoles.unverified, serverRoles.jailrole]).catch();
                await verifyUser.roles.add([serverRoles.member, serverRoles.verified]);
                const logChannel = guild.channels.cache.get(serverChannels.auditlogs)

                const verified = new EmbedBuilder()
                .setTitle(`Member has been verified!`)
                .setDescription(`${verifyUser} has been successfully verified`)
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
                interaction.reply({embeds: [verified], ephemeral: false});

            } else {
                await interaction.reply({embeds: [noPerms], ephemeral: true})
            }
        }

        if(splitId[0] === 'kickUser'){
            if(await isStaff(member.id)){
                guild.members.kick(splitId[1], `Kicked muzzled user by ${member.user.tag}`);
                const deleting = new EmbedBuilder()
                    .setDescription(`This channel is scheduled to be deleted in 10 seconds by ${member}`)
                    .setColor("Red")

                    await interaction.reply({embeds: [deleting], ephemeral: false}).then(async () => {
                        setTimeout(() => {
                            interaction.channel.delete().catch(err => console.error(err))
                        }, 10000);
                    })
            }
        }

        if(splitId[0] === 'deleteChannel'){
            if(splitId[1] === 'staff'){
                if(await isStaff(member.id)){
                    const deleting = new EmbedBuilder()
                    .setDescription(`This channel is scheduled to be deleted in 10 seconds by ${member}`)
                    .setColor("Red")

                    await interaction.reply({embeds: [deleting], ephemeral: false}).then(async () => {
                        setTimeout(() => {
                            interaction.channel.delete().catch(err => console.error(err))
                        }, 10000);
                    })
                } else {
                    await interaction.reply({content: `You are not permitted to do this action...`, ephemeral: true});
                }
            } else {
                const deleting = new EmbedBuilder()
                    .setDescription(`This channel is scheduled to be deleted in 10 seconds by ${member}`)
                    .setColor("Red")

                    await interaction.reply({embeds: [deleting], ephemeral: false}).then(async () => {
                        setTimeout(() => {
                            interaction.channel.delete().catch(err => console.error(err))
                        }, 10000);
                    })
            }
        }
    }
})