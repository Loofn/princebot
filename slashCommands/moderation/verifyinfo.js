const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { isMod, isAdmin, isTrialMod } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');

module.exports = {
    name: 'verifyinfo',
    description: 'Give user verification guidelines.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;


        if(await isTrialMod(member.id) || await isMod(member.id) || await isAdmin(member.id)){

            const verifyButton = new ButtonBuilder()
                .setCustomId(`verifyage-${member.id}`)
                .setLabel(`Verify Age`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✅')
            const row = new ActionRowBuilder()
                .addComponents(verifyButton);

            const verifyGuidelines = new EmbedBuilder()
                .setTitle(`Age Verification Guidelines`)
                .setDescription(`Here is what we need you to do, to verify your age. Remember if you do not verify your age, you will be **banned** from the server.\n\n## Steps to verify\n:arrow_right: You need either birth certificate, driver's license or passport.\n\n:arrow_right: Take a picture of the ID of your choosing, blurr any information on it except **date of birth** and place it on top of the paper. Paper has to have the server name and today's date written to it.\n\nOnce you have sent the image, wait for <@&1231405365674115112> to verify you.`)
                .setColor("LuminousVividPink")
                .setTimestamp()
                .setImage('https://i.imgur.com/E8wPLE8.png')
                .setFooter({text: `Follow the guidelines above so you know what you are expected to do`, iconURL: guild.iconURL()})

            await interaction.reply({embeds: [verifyGuidelines]})

        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }
}