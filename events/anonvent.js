const { EmbedBuilder} = require('discord.js');
const client = require('..');
const con = require('../function/db')

client.on('messageCreate', async message => {

    if(message.channel.id === '1234534548818100365'){

        let embed = new EmbedBuilder()
            .setDescription(`${message.content}`)
            .setTimestamp()
            .setColor("BLACK")
            .setFooter({text: `No | All messages to venting channel are anonymized!`})

        message.channel.send({embeds: [embed]}).then(() => {
            message.delete().catch(err => console.error(err));
        })
    }
})