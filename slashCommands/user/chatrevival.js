const { ApplicationCommandType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const serverRoles = require('../../data/serverRoles.json')
const con = require('../../function/db');
const {fetchThread} = require('../../function/db/fetchAgeVerifyThread');
const { saveUserRoles } = require('../../function/userRoles');
const moment = require('moment');
const { getWeather } = require('../../function/utils');

module.exports = {
    name: 'revivechat',
    description: 'Pings chat to wake up the gremlings',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        try {
            const [rows] = await con.execute(`SELECT * FROM timers WHERE name='revive'`);
            if(rows.length === 0 || moment().isAfter(rows[0].time)){

                const weatherHelsinki = await getWeather("Helsinki, Finland");
                const channel = guild.channels.cache.get('1231619809675051008')
                const embed = new EmbedBuilder()
                    .setImage('https://gifdb.com/images/high/cute-cat-yawn-vrv7o0lpgk5f479z.gif')
                    .setTitle(`WAKE UP SHEEPLE!`)
                    .setDescription(`${member} has rang the revival bell, wake up!!! Time to chat and talk, nice weather is it? It is currently ${weatherHelsinki[0].current.temperature}°C in Finland!`)
                
                channel.send({embeds: [embed], content: `@here`}).then(async (msg) => {
                    await interaction.reply({content: `Wake up call send to ${msg.url}`, ephemeral: true})
                })
                await con.execute(`INSERT INTO timers (name, time) VALUES ('revive', ?) ON DUPLICATE KEY UPDATE time=?`, [moment().add(6, 'hours').format("YYYY-MM-DD HH:mm:ss"), moment().add(6, 'hours').format("YYYY-MM-DD HH:mm:ss")]);
            } else {
                
                const embed = new EmbedBuilder()
                    .setDescription(`You need to wait for \`${moment(rows[0].time).toNow(true)}\` before reviving chat again!`)
                    .setColor("Red")

                await interaction.reply({embeds: [embed]});
            }
        } catch (err) {
            console.error('Error in chat revival:', err);
            await interaction.reply({content: 'An error occurred while trying to revive chat.', ephemeral: true});
        }
    }
}