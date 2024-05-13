const client = require("../..");
const con = require('../db')

async function fetchThread(userId, remove=false){

    con.query(`SELECT * FROM ageverify WHERE user='${userId}'`, function (err, res){
        if(res.length > 0){
            if(remove){
                deleteVerifyThread(userId);
            }

            return res[0].thread;
        } else {

            return false;
        }
    })
}

async function deleteVerifyThread(userId){
    const guild = client.guilds.cache.get('1231299437519966269')
    const channel = guild.channels.cache.get('1233466742148300984')
    
    con.query(`SELECT * FROM ageverify WHERE user='${userId}'`, function (err, res){
        if(res.length > 0){
            const thread = channel.threads.cache.get(res[0].thread)
            thread.delete().catch(console.error())
            con.query(`DELETE FROM ageverify WHERE user='${userId}'`)
        }
    })

}

module.exports = {fetchThread, deleteVerifyThread};