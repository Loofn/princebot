const { ApplicationCommandType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const serverRoles = require('../../data/serverRoles.json')
const con = require('../../function/db');
const moment = require('moment');


module.exports = {
    name: 'qotd',
    description: 'Manage Question of the Day',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

    }
}