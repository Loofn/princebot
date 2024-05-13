const { ApplicationCommandType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const serverRoles = require('../../data/serverRoles.json')
const con = require('../../function/db');
const {fetchThread} = require('../../function/db/fetchAgeVerifyThread');
const { saveUserRoles } = require('../../function/userRoles');


module.exports = {
    name: 'bottomdict',
    description: 'Bottom dictionary',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const embed = new EmbedBuilder()
            .setTitle(`Bottom Dictionary`)
            .setColor("White")
            .setDescription(`:one: Bottom: Refers to a person who typically takes a more passive or receptive role during sexual intercourse, especially in the context of anal sex.\n\n:two: "am innocent"\n\n:three: Power Bottom: A bottom who is particularly enthusiastic, assertive, or skilled in their role during sexual activities.\n\n:four: Versatile Bottom: A bottom who is open to occasionally or regularly taking on a top role during sexual encounters.\n\n:five: Bottoming: The act of being the receptive partner during anal sex.\n\n:six: Douching: The process of rinsing the rectum with water to clean it out before engaging in anal sex, to reduce the likelihood of messiness during intercourse.\n\n:seven: Topping from the Bottom: When a bottom tries to control or guide the sexual encounter even though they are technically in the submissive role.\n\n:eight: Bottom's High: The euphoric feeling experienced by some bottoms after a satisfying sexual encounter.\n\n:nine: Safe Word: A pre-agreed upon word or signal used during BDSM or other kinky activities to communicate that one participant wants to stop or slow down the action.`)
    
        await interaction.reply({embeds: [embed]});
    }
}