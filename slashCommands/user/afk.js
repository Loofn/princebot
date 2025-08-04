const { ApplicationCommandType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const serverRoles = require('../../data/serverRoles.json')
const con = require('../../function/db');
const {fetchThread} = require('../../function/db/fetchAgeVerifyThread');
const { saveUserRoles } = require('../../function/userRoles');
const moment = require('moment');


module.exports = {
    name: 'afk',
    description: 'Go AFK or come back to us...',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;


        const embed = new EmbedBuilder()
            .setTitle(`AFK setup`)
            .setDescription(`Select from the dropbox below if you would like to go AFK or come back`)
            .setColor("Random")
            .setThumbnail(member.displayAvatarURL())

        const select = new StringSelectMenuBuilder()
            .setCustomId('afkoptions')
            .setPlaceholder(`What would you like to do?`)
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Go AFK')
                    .setEmoji('💤')
                    .setValue('afk-start')
                    .setDescription('Give reason to your AFK and start it'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Change AFK reason')
                    .setEmoji('✏️')
                    .setValue('afk-reason')
                    .setDescription('Change the reason why you are AFK'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Come back from AFK')
                    .setEmoji('👋')
                    .setValue('afk-stop')
                    .setDescription('Come back from your AFK session to talk with rest of us')
            )

        const row = new ActionRowBuilder()
            .addComponents(select);

        const response = await interaction.reply({embeds: [embed], components: [row], ephemeral: true})

        const collectorFilter = i => i.user.id  === interaction.user.id;

        try {
            const comp = await response.awaitMessageComponent({filter: collectorFilter, time: 60_000});

            const choice = comp.values[0];

            if(choice === 'afk-start'){
                await interaction.editReply({components: []})
                const modal = new ModalBuilder()
                    .setCustomId('afk-setReason')
                    .setTitle('Starting your AFK journey...')

                const afkReasonInput = new TextInputBuilder()
                    .setCustomId('afk-reasoninput')
                    .setLabel('Reason for AFK')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(10)
                    .setMaxLength(1000)
                    .setRequired(true)

                const firstRow = new ActionRowBuilder().addComponents(afkReasonInput)
                modal.addComponents(firstRow);

                const afkReasonModal = await comp.showModal(modal);

                const afkReasonModalResponse = await comp.awaitModalSubmit({collectorFilter, time: 60_000});

                try {
                    const afkReason = afkReasonModalResponse.fields.getTextInputValue('afk-reasoninput')
                    startAFK(member.id, afkReason);

                    const embedAfk = new EmbedBuilder()
                        .setThumbnail('https://d.furaffinity.net/art/izabera0623/1626765036/1626713137.izabera0623_sleeping_hugo01-loop.gif')
                        .setDescription(`${member} has started their AFK with reason: \`${afkReason}\`. Hope to see you soon! <a:Catto_Roomba:1238633025470992384>`)

                    await afkReasonModalResponse.reply({embeds: [embedAfk]})
                } catch (e){
                    await response.editReply({content: 'Did not make your choice in 1 minute, cancelling...', components: [], embeds: []});
                }
            }

            if(choice === 'afk-reason'){
                await interaction.editReply({components: []})
                const modal = new ModalBuilder()
                    .setCustomId('afk-setReason')
                    .setTitle('Changing your AFK route...')

                const afkReasonInput = new TextInputBuilder()
                    .setCustomId('afk-reasoninput')
                    .setLabel('Reason for AFK')
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(10)
                    .setMaxLength(1000)
                    .setRequired(true)

                const firstRow = new ActionRowBuilder().addComponents(afkReasonInput)
                modal.addComponents(firstRow);

                await comp.showModal(modal);

                const afkReasonModalResponse = await comp.awaitModalSubmit({collectorFilter, time: 60_000});

                try {
                    const afkReason = afkReasonModalResponse.fields.getTextInputValue('afk-reasoninput')
                    startAFK(member.id, afkReason);

                    const embedAfk = new EmbedBuilder()
                        .setThumbnail('https://d.furaffinity.net/art/izabera0623/1626765036/1626713137.izabera0623_sleeping_hugo01-loop.gif')
                        .setDescription(`${member} has edited their reason to AFK: \`${afkReason}\`. Hope to see you soon! <a:Catto_Roomba:1238633025470992384>`)

                    await afkReasonModalResponse.reply({embeds: [embedAfk]})
                } catch (e){
                    await comp.editReply({content: 'Did not make your choice in 1 minute, cancelling...', components: [], embeds: []});
                }
            }

            if(choice === 'afk-stop'){
                await interaction.editReply({components: []})
                try {
                    const [rows] = await con.execute(`SELECT * FROM afk WHERE user=?`, [member.id]);
                    if(rows.length > 0){
                        await con.execute(`DELETE FROM afk WHERE user=?`, [member.id]);
                        const embed = new EmbedBuilder()
                            .setTitle('They are back!')
                            .setThumbnail('https://d.furaffinity.net/art/lawsonia/1676560450/1673815579.lawsonia_yawn.gif')
                            .setDescription(`${member} is back from their AFK journey. They were gone for \`${moment(rows[0].date).fromNow(true)}\` with reason \`${rows[0].reason}\`.`)
                        
                            await comp.reply({embeds: [embed]})
                    } else {
                        await comp.reply({content: `You are not AFK.... dude... what`, ephemeral: true})
                    }
                } catch (err) {
                    console.error('Error stopping AFK:', err);
                    await comp.reply({content: `An error occurred while stopping AFK.`, ephemeral: true})
                }
            }
        } catch (e){
            console.log(e)
            await interaction.editReply({content: 'Did not make your choice in 1 minute, cancelling...', components: [], embeds: []});
        }
    }
}

async function startAFK(userId, reason){
    const time = moment().format("YYYY-MM-DD HH:mm:ss")
    const sql = `INSERT INTO afk VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE reason=?, date=?`
    await con.execute(sql, [userId, reason, time, reason, time]);
    return true;
}