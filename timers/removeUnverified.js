const client = require("..");
const serverRoles = require('../data/serverRoles.json');
const moment = require('moment');
const con = require('../function/db')
const {addModlog} = require('../function/modlog')

async function removeUnverified(){

    const guild = client.guilds.cache.get('1231299437519966269');
    con.query(`SELECT * FROM kindergarten`, function (err, res){
        //console.log(res.length)
        if(res.length === 0) return;

        for(i = 0; i < res.length; i++){
            //if(!res[i]) break;
            if(moment().isAfter(res[i].time)){
                con.query(`DELETE FROM kindergarten WHERE user='${res[i].user}'`)
                let member = guild.members.cache.get(res[i].user);
                if(!member) continue;

                if(member.roles.cache.get(serverRoles.unverified)){

                    member.ban({reason: 'Unverified for 24 hours'})
                    addModlog(member.id, "BAN", "0", "Unverified for 24 hours");
                }

            } else continue;
        }
    })

}

module.exports = removeUnverified;