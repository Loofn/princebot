const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin, isVIP } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const queryAsync = require('../../function/queryAsync');
const con = require('../../function/db');
const moment = require('moment');
const { getRandomInteger } = require('../../function/utils');
const { givePoints } = require('../../function/furrygame');
const { addToGame } = require('../../events/petfurry');

module.exports = {
    name: 'Lofn nutted',
    type: ApplicationCommandType.Message,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;
        console.log(`Running lofnFavorites command for user ${member.id} in guild ${guildId}`);
        // Check permissions first before deferring
        if(!(await isAdmin(member.id))){
            await interaction.reply({embeds: [noPerms], ephemeral: true});
            return;
        }

        await interaction.deferReply({ephemeral: true});

        try {
            const targetMessage = interaction.targetMessage;
            console.log(`Processing lofnFavorites for user ${targetMessage.author.id}`);
            
            // Get current nutcount for the user
            console.log('Querying existing stats...');
            const existingStats = await queryAsync(con, `
                SELECT value FROM stats WHERE user = ? AND name = 'nutcount'
            `, [targetMessage.author.id]);
            
            let nutcount = 1;
            if (existingStats.length > 0) {
                nutcount = existingStats[0].value + 1;
                console.log(`Updating nutcount to ${nutcount}`);
                // Update existing nutcount
                await queryAsync(con, `
                    UPDATE stats SET value = value + 1 
                    WHERE user = ? AND name = 'nutcount'
                `, [targetMessage.author.id]);
            } else {
                console.log('Creating new nutcount record');
                // Insert new nutcount record
                await queryAsync(con, `
                    INSERT INTO stats (user, name, value) VALUES (?, 'nutcount', 1)
                `, [targetMessage.author.id]);
            }
            
            // Generate random cumcoin reward and give to user
            const cumcoin = getRandomInteger(10);
            console.log(`Giving ${cumcoin} cumcoins to user`);
            await addToGame(targetMessage.author.id);
            await givePoints(targetMessage.author.id, cumcoin);
            
            // Create the embed message
            const exposedMsg = new EmbedBuilder()
                .setAuthor({name: `${targetMessage.author.globalName} made Lofn nut`, iconURL: targetMessage.author.displayAvatarURL()})
                .setDescription(`💦💦 *Fuuuckkghhh...*\n*${targetMessage.author} has made Lofn nut ${nutcount} time(s)*\nThey were also awarded \`+${cumcoin} cumcoins\` <a:Lewd_Coom:1235063571868680243>\n\n${targetMessage.content}`)
                .setFooter({text: `Lofn has nutted to this one... ${moment(targetMessage.createdTimestamp).format("DD/MM/YYYY")}`})
                .addFields(
                    {name: `Jump to message`, value: `${targetMessage.url}`, inline: true}
                );

            const exposedCh = guild.channels.cache.get('1234183271215005887');

            // Handle attachments properly - only set image for actual images
            if (targetMessage.attachments.size > 0 && !targetMessage.author.bot) {
                const attachment = targetMessage.attachments.first();
                const isImage = attachment.contentType && attachment.contentType.startsWith('image/');
                
                if (isImage) {
                    exposedMsg.setImage(attachment.url);
                } else {
                    // For videos and other files, add them as a field instead
                    exposedMsg.addFields({
                        name: 'Attachment', 
                        value: `[${attachment.name || 'File'}](${attachment.url})`,
                        inline: true
                    });
                }
            }

            console.log('Sending embed message...');
            // Send the embed and ping user (deleted after 2 seconds)
            await exposedCh.send({embeds: [exposedMsg]});
            const pingMsg = await exposedCh.send({content: `${targetMessage.author}`});
            setTimeout(() => {
                pingMsg.delete().catch(console.error);
            }, 2000);

            console.log('Command completed successfully');
            await interaction.editReply({content: `DONE!`});
            
        } catch (error) {
            console.error('Error in lofnFavorites command:', error);
            console.error('Stack trace:', error.stack);
            try {
                await interaction.editReply({content: 'An error occurred while processing the command.'});
            } catch (replyError) {
                console.error('Failed to reply with error message:', replyError);
            }
        }
    }
}