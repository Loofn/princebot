const { EmbedBuilder } = require('discord.js');
const client = require('..');
const moment = require('moment');
const { getDominantColorFromURL } = require('./utils');


async function greetNewKindergarteners(user){

    const guild = client.guilds.cache.get(process.env.GUILD_ID)
    const KGchannel = guild.channels.cache.get('1233466742148300984')
    const banDate = moment().add(24, 'hours').unix();

    const embed = new EmbedBuilder()
        .setTitle(`New kid arrived...`)
        .setDescription(`Please confirm your age or you will be removed automatically from the server in **24 hours!** (<t:${banDate}:R>)`)
        .setImage("https://d.furaffinity.net/art/-babyfursyrik-/1646219906/1646219906.-babyfursyrik-_%D1%80%D0%B5%D0%B1%D0%B5%D0%BD%D0%BE%D0%BA_%D1%8E%D1%87_deebu.gif")
        .setThumbnail(user.displayAvatarURL())
        .setFooter({
            text: `Tik Tok... clock is ticking...`,
            iconURL: guild.iconURL()
        })

    await KGchannel.send({content: `${user}`, embeds: [embed]});
    await user.send({embeds: [embed]}).catch();
}

module.exports = {
    greetNewKindergarteners
}