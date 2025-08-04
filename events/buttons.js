const { EmbedBuilder, ChannelType, ButtonStyle, ButtonBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const client = require('..');
const con = require('../function/db')
const moment = require('moment');
const {defaultAvatar} = require('../function/sus')
const {isStaff} = require('../function/roles')
const {noPerms} = require('../data/embeds');
const { deleteVerifyThread } = require('../function/db/fetchAgeVerifyThread');
const serverRoles = require('../data/serverRoles.json')
const serverChannels = require('../data/channels.json');
const { saveUserRoles } = require('../function/userRoles');
const { getPoints, removePoints } = require('../function/furrygame');
const { fixNumber } = require('./countingGame');
const { getUserInventory, removeItemFromUser, getItemQuantity } = require('../function/inventory');

client.on('interactionCreate', async interaction => {

    if(interaction.isModalSubmit()){
        const { customId } = interaction;

        if(customId.startsWith('addTimeModal-')){
            const userId = customId.split('-')[1];
            const durationInput = interaction.fields.getTextInputValue(`durationInput-${userId}`);
            if(isNaN(durationInput) || durationInput <= 0) {
                return interaction.reply({ content: 'Please provide a valid number of hours.', ephemeral: true });
            }
            const duration = parseInt(durationInput);
            if(duration > 24) {
                return interaction.reply({ content: 'You can only add up to 24 hours at a time.', ephemeral: true });
            }
            const newTime = moment().add(durationInput, 'hours').format('YYYY-MM-DD HH:mm:ss');
            try {
                await con.execute(`UPDATE kindergarten SET time = ? WHERE user = ?`, [newTime, userId]);
                interaction.reply({ content: `:alarm: Added \`${durationInput}\` hours to the verification time for <@${userId}> by ${interaction.member}`});
            } catch (err) {
                console.error('Database error:', err);
                return interaction.reply({ content: 'An error occurred while updating the time.', ephemeral: true });
            }
        }
    }

    if(interaction.isButton()){
        const member = interaction.member;
        const customId = interaction.customId;
        const guild = interaction.member.guild;
        const splitId = customId.split('-');

        if(splitId[0] === 'deleteVentMsg'){
            const isStaffMember = await isStaff(member.id);
            if(interaction.message.author.id === member.id || isStaffMember){
                let embed = EmbedBuilder.from(interaction.message.embeds[0]);
                const deleter = isStaffMember ? "moderator" : "user";
                embed.setDescription(`This message has been deleted by ${deleter}.`);
                embed.setColor("Red");
                interaction.message.edit({embeds: [embed], components: []}).catch(err => console.error(err));
                if (interaction.message.hasThread) {
                    interaction.message.thread.delete().catch(err => console.error(err));
                }

                // Audit log for deleted vent message
                const logChannel = interaction.guild.channels.cache.get(serverChannels.auditlogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Venting Message Deleted')
                        .setDescription(embed.data.description || 'No description')
                        .setColor("Red")
                        .addFields(
                            isStaffMember
                                ? { name: 'Deleted by', value: `${member} (${member.id})`, inline: true }
                                : { name: 'Deleted by', value: `user`, inline: true },
                            { name: 'Message ID', value: `${interaction.message.id}`, inline: true }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] }).catch(console.error);
                }
            } else {
                await interaction.reply({content: `You are not permitted to delete this message!`, ephemeral: true});
            }
        }

        if(splitId[0] === 'saveCountingStreak'){
            const userId = member.id;
            const userInventory = await getUserInventory(userId);
            const userItem = userInventory.find(i => i.item_id === "save_counting_coupon");
            const userItemCount = userItem ? userItem.quantity : 0;

            if(userItemCount <= 0){
                return await interaction.reply({content: `You don't have a Save Counting Coupon!`, ephemeral: true});
            }

            const msgFetch = await interaction.channel.messages.fetch({limit: 1});
            const latestMsg = msgFetch.first();

            if(latestMsg.author.bot && !latestMsg.embeds[0].title.startsWith("Streak")){
                // Use the coupon
                await removeItemFromUser(userId, "save_counting_coupon", 1);
                fixNumber(parseInt(splitId[1]));

                const savedEmb = new EmbedBuilder()
                    .setTitle(`Streak has been saved!`)
                    .setDescription(`${member} used their coupon to save the streak. You can now continue the game like there was no fail at all!`)

                const disabledButton = new ButtonBuilder()
                    .setCustomId(`saveCountingStreak-${splitId[1]}`)
                    .setLabel(`Save the streak (used coupon)`)
                    .setEmoji('🙏')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true);

                const row = new ActionRowBuilder()
                    .setComponents(disabledButton);

                interaction.message.edit({embeds: [interaction.message.embeds[0]], components: [row]})

                interaction.reply({embeds: [savedEmb]});
            } else {
                interaction.reply({content: `Game is going already... touche-`, ephemeral: true});
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

                const addTimeButton = new ButtonBuilder()
                    .setCustomId(`addTime-${member.id}`)
                    .setLabel(`Add time to verify`)
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏳')

                const row = new ActionRowBuilder()
                    .addComponents(verifyButton, deleteThread, addTimeButton)

                const verifyGuidelines = new EmbedBuilder()
                    .setTitle(`Age Verification of ${member.user.username}`)
                    .setDescription(`Here is what we need you to do, to verify your age. Remember if you do not verify your age, you will be **banned** from the server.\n\n## Steps to verify\n:arrow_right: You need either birth certificate, driver's license or passport.\n\n:arrow_right: Take a picture of the ID of your choosing, blurr any information on it except **date of birth** and place it on top of the paper. Paper has to have the server name and today's date written to it.\n\nOnce you have sent the image, wait for <@&1231405365674115112> to verify you.`)
                    .setColor("LuminousVividPink")
                    .setImage('https://i.imgur.com/E8wPLE8.png')
                    .setTimestamp()
                    .setFooter({text: `Follow the guidelines above so you know what you are expected to do`, iconURL: guild.iconURL()})

                await thread.send({embeds: [verifyGuidelines], components: [row]});
                await con.execute(`INSERT INTO ageverify VALUES (?, ?) ON DUPLICATE KEY UPDATE thread=?`, [member.id, thread.id, thread.id]);

                await interaction.reply({content: `Your age verify has been opened in ${thread}!`, ephemeral: true}).catch(err => console.log(err))
            })
        }
        if(splitId[0] === 'addTime'){
            if(await isStaff(member.id)){
                const verifyUser = await guild.members.cache.get(splitId[1]);

                const modal = new ModalBuilder()
                    .setCustomId(`addTimeModal-${verifyUser.id}`)
                    .setTitle(`Add time to verify for ${verifyUser.user.username}`);

                const durationInput = new TextInputBuilder()
                    .setCustomId(`durationInput-${verifyUser.id}`)
                    .setLabel(`Duration (in hours)`)
                    .setStyle(TextInputStyle.Short);

                const row = new ActionRowBuilder().addComponents(durationInput);
                modal.addComponents(row);

                await interaction.showModal(modal);
            }
        }
        
        if(splitId[0] === 'cancel' && splitId[1] === 'order'){
            const orderId = splitId[2];
            
            // Update the embed to show cancelled status
            const embed = new EmbedBuilder()
                .setTitle('❌ Order Cancelled')
                .setColor('#dc3545')
                .setDescription('Your cumcoins purchase has been cancelled.')
                .addFields(
                    { name: '🆔 Order ID', value: `\`${orderId}\``, inline: true },
                    { name: '👤 User', value: member.displayName, inline: true }
                )
                .setTimestamp();

            await interaction.update({
                embeds: [embed],
                components: []
            });

            console.log(`Order cancelled: ${orderId} by ${member.user.username} (${member.id})`);
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
                    await con.execute(`UPDATE users SET isMember=1 WHERE user=?`, [member.id]);
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

        if(splitId[0] === 'revert'){
            if(!await isStaff(member.id)){
                return await interaction.reply({content: `You are not permitted to revert cum count!`, ephemeral: true});
            }

            const userId = splitId[1];
            const logChannel = guild.channels.cache.get('1397631559317586014');
            const cumAmount = parseInt(splitId[3]);
            const coins = parseInt(splitId[2]);

            let embed = EmbedBuilder.from(interaction.message.embeds[0]);
            embed.setDescription(`This count was reverted by moderator (rule breaking).`);
            embed.setColor("Red")
            embed.setImage(null);

            // Revert the cum count
            await removePoints(userId, coins);
            try {
                await con.execute(
                    `UPDATE cumcount SET count = count - 1, amount = amount - ? WHERE user = ?`,
                    [cumAmount, userId]
                );
                
                await interaction.reply({ content: `Cum count for <@${userId}> has been reverted.`, ephemeral: true });
            } catch (err) {
                console.error('Database error:', err);
                return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
            }
        }
    }
})