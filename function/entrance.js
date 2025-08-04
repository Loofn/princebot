const { EmbedBuilder } = require('discord.js');
const client = require('..');
const con = require('./db');
const queryAsync = require('./queryAsync');
const moment = require('moment');
const serverRoles = require('../data/serverRoles.json')



/**
 * Check #entrance channel 
 */
async function checkEntrance(){

    const guild = client.guilds.cache.get('1231299437519966269');
    const usersToCheck = await guild.members.fetch()
    const filteredMembers = usersToCheck.filter(memb => memb.roles.cache.size === 1);
    filteredMembers.forEach(async (member) => {
        const joinDate = moment(member.joinedAt);
        const twelveHours = moment().subtract(12, 'hours');
        if(moment(joinDate).isBefore(twelveHours)){
            const welcomeMsgId = await getWelcomeMsg(member.id);
            member.kick(`Not accepting rules in 12 hours.`)
            if(welcomeMsgId){

                const welcomeMsg = await guild.channels.cache.get('1231409498686623804').messages.fetch(welcomeMsgId);
                
                if(welcomeMsg){
                    await welcomeMsg.delete();
                }
            }
        }
    })
}

async function checkEntranceAfterLeaving(userId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const res = await queryAsync(con, `SELECT * FROM users WHERE user=? AND isMember=0`, [userId]);
    if(res.length > 0){
        const welcomeMsg = await guild.channels.cache.get('1231409498686623804').messages.fetch(res[0].joinMessage, {force: true}).catch(console.error);
        if(welcomeMsg){
            await welcomeMsg.delete();
        }
    }
}

async function getWelcomeMsg(userId){
    const sql = `SELECT joinMessage FROM users WHERE user=?`;
    const res = await queryAsync(con, sql, [userId]);
}

/**
 * Store users to Lounge database
 * 
 * @param {String} userId ID of the stored user
 * @param {String} msgId ID of the entrance message
 */
async function storeUsers(userId, msgId) {
    const guild = client.guilds.cache.get('1231299437519966269');

    const member = guild.members.cache.get(userId);
    const joinDate = member ? moment(member.joinedAt).format("YYYY-MM-DD HH:mm:ss") : null;
    const isMember = member.roles.cache.get(serverRoles.member) ? 1 : 0;
    const sql = `INSERT INTO users (user, joinMessage, firstJoin, isMember) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE firstJoin = ?, isMember = ?`;
    try {
        await con.execute(sql, [userId, msgId, joinDate, isMember, joinDate, isMember]);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function storeOldUsers() {
    const guild = client.guilds.cache.get('1231299437519966269');

    const members = guild.members.cache;
    let newUserCount = 0; // Counter for new users added to the database

    members.forEach(member => {
        const userId = member.id;
        const joinDate = moment(member.joinedAt).format("YYYY-MM-DD HH:mm:ss");

        if (storeUsers(userId, null, joinDate)) {
            newUserCount++;
        }
    });

    return newUserCount;
}


// TODO:
// NEEDS A WAY TO CHECK THAT THE USER IS NOT DM'D MULTIPLE TIMES!
async function remindAboutRules(){
    const guild = client.guilds.cache.get('1231299437519966269');

    const usersToCheck = await guild.members.fetch()
    const filteredMembers = usersToCheck.filter(memb => memb.roles.cache.size === 1);
    filteredMembers.forEach(async (member) => {
        const joinDate = moment(member.joinedAt);
        const hours = moment().subtract(2, 'hours');
        if(moment(joinDate).isBefore(hours)){
            try {
                const [rows] = await con.execute(`SELECT * FROM users WHERE user=? AND ruleReminder=0 AND isMember=0`, [member.id]);
                if(rows.length === 0){
                    const embed = new EmbedBuilder()
                        .setTitle(`POKE!!`)
                        .setThumbnail(guild.iconURL())
                        .setDescription(`Hello there :wave: Seems like you have joined \`${guild.name}\` but then never accepted our rules <:Furr_Gasp:1232039664584626276> Make sure you check them, and accept them before you are kicked!!`)
                        .setColor("Red")
                        .setTimestamp()
        
                    member.send({ embeds: [embed] }).catch(error => {
                        console.error(`Failed to send message to user ${member.id}:`, error);
                    });
                    await con.execute(`UPDATE users SET ruleReminder=1 WHERE user=?`, [member.id]);
                }
            } catch (err) {
                console.error('Error checking user for rule reminder:', err);
            }
        }
        
    })
}

module.exports = {
    storeUsers,
    checkEntrance,
    storeOldUsers,
    checkEntranceAfterLeaving,
    remindAboutRules
}