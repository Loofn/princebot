const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const con = require('../function/db')
const queryAsync = require('../function/queryAsync');
const moment = require('moment');
const client = require("..");
const serverRoles = require('../data/serverRoles.json')

async function remindUnverified(){

    const res = await queryAsync(con, `SELECT * FROM timers WHERE name='unverifiedtimer'`, []);
    if(res.length > 0){
        const lastTime = moment(res[0].time);
        const guild = client.guilds.cache.get('1231299437519966269');
        const members = guild.members.cache.filter(m => !m.user.bot && m.roles.cache.get(serverRoles.unverified));
        if(members.length <= 0) return;
        if(moment().isAfter(lastTime)){
            const ageverify = new ButtonBuilder()
                .setCustomId('ageverifybtn')
                .setLabel('Verify your age')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('')
            const row = new ActionRowBuilder()
                .addComponents(ageverify)
            const reminder = new EmbedBuilder()
                .setTitle(`PING PONG DING DONG!`)
                .setDescription(`Use command \`/ageverify\` to start your age verification process. \n\n:warning: If you fail to verify in 24 hours of receiving <@&${serverRoles.unverified}> role, you will be removed.`)
                .setColor("Yellow")
                .setImage("https://i.pinimg.com/originals/81/79/b5/8179b530237c2c657e2b17bd4b00c02e.gif");
            const unverifiedChannel = guild.channels.cache.get('1233466742148300984');
            const oldMessages = await unverifiedChannel.messages.fetch({limit: 100})
            const oldReminder = oldMessages.find(m => m.embeds[0] && m.embeds[0].description.includes("If you fail to verify in 24 hours"));
            if(oldReminder){
                oldReminder.delete()
            }
            unverifiedChannel.send({embeds: [reminder], content: `<@&1233466340799414476>`, components: [row]});
            const newTime = moment().add(6, 'hours').format('YYYY-MM-DD HH:mm:ss');
            await queryAsync(con, `UPDATE timers SET time=? WHERE name='unverifiedtimer'`, [newTime]);
        }
    }
    
}

module.exports = remindUnverified;