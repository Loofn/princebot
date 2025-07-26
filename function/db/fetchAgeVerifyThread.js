const client = require("../..");
const con = require('../db')
const queryAsync = require('../queryAsync');

async function fetchThread(userId, remove=false){
    const res = await queryAsync(con, `SELECT * FROM ageverify WHERE user=?`, [userId]);
    if(res.length > 0){
        if(remove){
            await deleteVerifyThread(userId);
        }
        return res[0].thread;
    } else {
        return false;
    }
}

async function deleteVerifyThread(userId){
    const guild = client.guilds.cache.get('1231299437519966269')
    const channel = guild.channels.cache.get('1233466742148300984')
    
    const res = await queryAsync(con, `SELECT * FROM ageverify WHERE user=?`, [userId]);
    if(res.length > 0){
        const thread = channel.threads.cache.get(res[0].thread)
        thread.delete().catch(console.error())
        await queryAsync(con, `DELETE FROM ageverify WHERE user=?`, [userId]);
    }

}

module.exports = {fetchThread, deleteVerifyThread};