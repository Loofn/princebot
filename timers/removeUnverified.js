const client = require("..");
const serverRoles = require('../data/serverRoles.json');
const moment = require('moment');
const con = require('../function/db')
const {addModlog} = require('../function/modlog')

async function removeUnverified(){
    const guild = client.guilds.cache.get('1231299437519966269');
    try {
        const [rows] = await con.execute(`SELECT * FROM kindergarten`);
        //console.log(rows.length)
        if(rows.length === 0) return;

        for(let i = 0; i < rows.length; i++){
            //if(!rows[i]) break;
            if(moment().isAfter(rows[i].time)){
                await con.execute(`DELETE FROM kindergarten WHERE user=?`, [rows[i].user]);
                let member = guild.members.cache.get(rows[i].user);
                if(!member) continue;

                if(member.roles.cache.get(serverRoles.unverified)){
                    member.ban({reason: 'Unverified for 24 hours'})
                    await addModlog(member.id, "BAN", "0", "Unverified for 24 hours");
                }

            } else continue;
        }
    } catch (err) {
        console.error('Error removing unverified users:', err);
    }
}

module.exports = removeUnverified;