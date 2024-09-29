const fs = require('fs');
const path = require('path');
const {glob} = require('glob')
const { ApplicationCommandType, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const moment = require('moment');
const con = require('../../function/db');
const { getUptime } = require('../../function/uptime');

module.exports = {
    name: 'bot',
    description: 'Display information about the bot.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const now = moment();
        const started = moment("21042024", "DDMMYYYY")
        const daysCoded = started.fromNow();
        const avghour = 3;
        const daysBetween = moment.duration(now.diff(started)).asDays();
        const totalHours = Math.round(daysBetween * avghour);

        const usedMem = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const usedHeap = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

        const botLatency = Date.now() - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);
        const start = Date.now();
        let dbLatency;
        try {

            await con.query('SELECT 1');
            dbLatency = Date.now() - start;
        } catch (error) {
            console.error('Database error:', error);
            dbLatency = 'Error';
        }
        const totalLines = await countLinesOfCode();
        const embed = new EmbedBuilder()
        .setTitle(`Statistics about Mutt`)
        .setColor("DarkButNotBlack")
        .setDescription(`Current uptime is \`${getUptime().fromNow(true)}\`\n\n${interaction.client.user} has been developed by <@102756256556519424> for \`~${totalHours} hours\` *that is ${Math.floor(totalHours / 24)} days*, starting ${daysCoded}`)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .addFields(
            {name: `Lines of code`, value: `\`${totalLines}\``, inline: true},
            {name: `RAM usage`, value: `Currently: \`${usedMem} MB\`\nHeap: \`${usedHeap} MB\``, inline: true},
            {name: `Latency`, value: `Bot: \`${moment.duration(botLatency).milliseconds()}ms\`\nDatabase: \`${dbLatency !== 'Error' ? moment.duration(dbLatency).milliseconds() + 'ms' : 'Error'}\`\nAPI: \`${moment.duration(apiLatency).milliseconds()}ms\``, inline: true}
        )

        interaction.reply({embeds: [embed]})
        
    }
}

async function countLinesOfCode() {
    return new Promise(async (resolve, reject) => {
        const jsfiles = await glob('**/*.js', { ignore: 'node_modules/**' });

        let totalLines = 0;

        jsfiles.forEach(file => {
            const fileContents = fs.readFileSync(file, 'utf8');
            totalLines += fileContents.split('\n').length;
        })  

        resolve(totalLines)
    })
    
}