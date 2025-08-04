const { EmbedBuilder } = require('@discordjs/builders');
const client = require('..');
const con = require('../function/db')
const moment = require('moment')

client.on('messageCreate', async msg => {

    if(msg.author.bot) return;

    if(msg.mentions.users.size === 0) return;

    try {
        const [rows] = await con.execute(`SELECT * FROM afk WHERE user=?`, [msg.mentions.users.first().id]);
        if(rows.length > 0){
            const embed = new EmbedBuilder()
                .setTitle('💤')
                .setThumbnail('https://d.furaffinity.net/art/izabera0623/1626765036/1626713137.izabera0623_sleeping_hugo01-loop.gif')
                .setFooter({text: `This is not invitation to spam ping them or spam their DMs...`, iconURL: msg.mentions.users.first().displayAvatarURL()})
                .setDescription(`${msg.mentions.users.first()} has been AFK for ${moment(rows[0].date).fromNow(true)} with reason \`${rows[0].reason}\`. They will get back to you once they wake up...`)

            msg.reply({embeds: [embed]});
        }
    } catch (err) {
        console.error('Error checking AFK status:', err);
    }
})