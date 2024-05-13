const { ApplicationCommandType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const serverRoles = require('../../data/serverRoles.json')
const con = require('../../function/db');
const moment = require('moment');
const fetch = require('node-fetch')
const { getWeather } = require('../../function/utils');

module.exports = {
    name: 'clock',
    description: 'Check what time it is in select country',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'city',
            description: 'Which city we are looking for time?',
            type: 3,
            required: true
        },
        {
            name: 'continent',
            description: 'Which continent is the city in?',
            type: 3,
            required: true,
            choices: [
                {name: 'africa', value: 'Africa'},
                {name: 'america', value: 'America'},
                {name: 'asia', value: 'Asia'},
                {name: 'pacific', value: 'Pacific'},
                {name: 'europe', value: 'Europe'}
            ]
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        let city = options.getString('city');
        city = city.charAt(0).toUpperCase() + city.slice(1);
        let continent = options.getString('continent');
        await interaction.deferReply();

        try {
            const response = await fetch(`https://worldtimeapi.org/api/timezone/${continent}/${city}`);
            const data = await response.json();

            if(data.error){
                const embed = new EmbedBuilder()
                    .setTitle(`Time checking... failed`)
                    .setDescription(`City (\`${city}\`) not found from the continent provided (\`${continent}\`), make sure you spelled it right or choose different continent.`)
                    .setColor("Red")
                return await interaction.editReply({embeds: [embed]});
            }

            const weatherF = await getWeather(`${city}, ${continent}`, "F");
            const weatherC = await getWeather(`${city}, ${continent}`, "C");

            const embed = new EmbedBuilder()
                .setTitle(`Time checking`)
                .setThumbnail('https://d.furaffinity.net/art/slidezone/1488278723/1309592373.slidezone_26.gif')
                .setColor("DarkButNotBlack")
                .setDescription(`It is currently \`${moment(data.utc_datetime).utcOffset(data.utc_offset).format("H:mm a")}\` in \`${city}\`!\nIt is also ${weatherC[0].current.temperature}°C / ${weatherF[0].current.temperature}°F in there!`)
        
            await interaction.editReply({embeds: [embed]});
        } catch (err){
            console.error('Error fetching time:', err)
            await interaction.editReply({content: `Something went wrong... please let Lofn know!`})
        }
    }
}

