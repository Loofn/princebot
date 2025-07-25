const { EmbedBuilder } = require('discord.js');
const client = require('..');
const con = require('../function/db');
const moment = require('moment');
const serverRoles = require('../data/serverRoles.json')

client.on('messageCreate', async msg => {

    if(msg.author.id === '302050872383242240'){
        if(msg.embeds.length > 0){
            if(msg.embeds[0].description.toLowerCase().includes("bump done")){
                const bumper = msg.interaction.user;
                msg.reply(`<:Furr_PuroPing:1232435896783999050> **Thank you for the bumping!** I will remind when you can bump again.`);
                con.query(`INSERT INTO timers VALUES ('bump', '${moment().add(2, 'hours').format("YYYY-MM-DD HH:mm:ss")}', '${bumper.id}') ON DUPLICATE KEY UPDATE time='${moment().add(2, 'hours').format("YYYY-MM-DD HH:mm:ss")}'`)
            }
        }
    }
})

async function checkBumping(){
    con.query(`SELECT * FROM timers WHERE name='bump'`, function (err, res){
        if (err) {
            console.error('Database error:', err);
            return;
        }
        if (!res || res.length === 0){
            console.error('No bump timers found');
            return;
        }
        if(moment().isAfter(res[0].time)){
            con.query(`DELETE FROM timers WHERE name='bump'`);
            const guild = client.guilds.cache.get('1231299437519966269');
            const bumpCh = guild.channels.cache.get('1233015104187138048');
            const bumper = guild.members.cache.get(res[0].note);
            const bumpReminder = new EmbedBuilder()
                .setTitle(`It is BUMP time!`)
                .setDescription(`Hey there ${bumper}, do you have time to bump us, using command \`/bump\`. That would be amazing! ^3^`)
                .setTimestamp()
                .setColor("Random");

            bumpCh.send({embeds: [bumpReminder], content: `${bumper} <@&${serverRoles.bumper}>`})
        }
    })
}

module.exports = {
    checkBumping
}