const { EmbedBuilder } = require('discord.js');
const client = require('..');
const con = require('../function/db');
const moment = require('moment');
const serverRoles = require('../data/serverRoles.json')
const { givePoints } = require('../function/furrygame');

client.on('messageCreate', async msg => {

    if(msg.author.id === '302050872383242240'){
        if(msg.embeds.length > 0){
            if(msg.embeds[0].description.toLowerCase().includes("bump done")){
                const bumper = msg.interaction.user;
                await givePoints(bumper.id, 10);
                msg.reply(`<:Furr_PuroPing:1232435896783999050> **Thank you for the bumping!** I will remind when you can bump again.\n\n You have received \`+10 cumcoins\` for bumping!`);
                await con.execute(`INSERT INTO timers VALUES ('bump', ?, ?) ON DUPLICATE KEY UPDATE time=?`, [moment().add(2, 'hours').format("YYYY-MM-DD HH:mm:ss"), bumper.id, moment().add(2, 'hours').format("YYYY-MM-DD HH:mm:ss")]);
            }
        }
    }
})

async function checkBumping(){
    try {
        const [rows] = await con.execute(`SELECT * FROM timers WHERE name='bump'`);
        if (!rows || rows.length === 0){
            console.error('No bump timers found');
            return;
        }
        if(moment().isAfter(rows[0].time)){
            await con.execute(`DELETE FROM timers WHERE name='bump'`);
            const guild = client.guilds.cache.get('1231299437519966269');
            const bumpCh = guild.channels.cache.get('1233015104187138048');
            const bumper = guild.members.cache.get(rows[0].note);
            const bumpReminder = new EmbedBuilder()
                .setTitle(`It is BUMP time!`)
                .setDescription(`Hey there ${bumper}, do you have time to bump us, using command \`/bump\`. That would be amazing! ^3^`)
                .setTimestamp()
                .setColor("Random");

            bumpCh.send({embeds: [bumpReminder], content: `${bumper} <@&${serverRoles.bumper}>`})
        }
    } catch (err) {
        console.error('Database error checking bump timer:', err);
    }
}

module.exports = {
    checkBumping
}