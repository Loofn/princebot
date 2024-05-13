const { ApplicationCommandType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const serverRoles = require('../../data/serverRoles.json')
const con = require('../../function/db');
const {fetchThread} = require('../../function/db/fetchAgeVerifyThread');
const { saveUserRoles } = require('../../function/userRoles');


module.exports = {
    name: 'artistrole',
    description: 'Request artist role for yourself to post in artist-only channels.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        //console.log("debug")
        if(member.roles.cache.get('1235261365095108608')){
            const verifiedalready = new EmbedBuilder()
            .setTitle(`You are already artist in the server...`)
            .setDescription(`You have access to post in <#1235261248124358699> already. Enjoy-!`)
            .setColor("Red")

            return interaction.reply({embeds: [verifiedalready], ephemeral: true})
        }

        if(!member.roles.cache.get(serverRoles.verified)){
            const notageverified = new EmbedBuilder()
            .setTitle(`You are not age verified`)
            .setDescription(`To receive <@&1235261365095108608> role, you must be age verified first. Please use command \`/ageverify\` first!`)
            .setColor("Red")

            return interaction.reply({embeds: [notageverified], ephemeral: true})
        }

        const artistModal = new ModalBuilder()
            .setCustomId(`artist-${member.id}`)
            .setTitle(`Artist role request`)


        const socials = new TextInputBuilder()
            .setCustomId(`socials`)
            .setLabel(`Art socials (DeviantArt, Twitter, etc.)`)
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph)

        const additionalinfo = new TextInputBuilder()
            .setCustomId(`info`)
            .setLabel(`Any additional information?`)
            .setRequired(false)
            .setStyle(TextInputStyle.Paragraph)
        
        const textRow = new ActionRowBuilder().addComponents(socials);
        const textRow2 = new ActionRowBuilder().addComponents(additionalinfo)

        artistModal.addComponents(textRow, textRow2)

        await interaction.showModal(artistModal);
    }
}