const client = require("..");
const con = require('../function/db')

async function saveUserRoles(userId, chId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = guild.members.cache.get(userId);

    const roles = member.roles.cache.map((role) => role.id);
    const roleJson = JSON.stringify(roles);
    const sql = `INSERT INTO user_roles (user, roles, channel) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE roles = ?`
    con.query(sql, [member.id, roleJson, chId, roleJson], (err) => {
        if(err){
            console.error('Error with DB:', err);
        } else {
            console.log(`${member.user.username} roles saved to DB:`, roleJson);
        }
    })
}

async function restoreUserRoles(userId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = guild.members.cache.get(userId);

    con.query(`SELECT * FROM user_roles WHERE user='${member.id}'`, function (err, res){
        const rolesJson = res[0]?.roles;

        if(!rolesJson){
            console.log(`No roles found`)
            return;
        }

        const roles = JSON.parse(rolesJson);

        member.roles.set(roles).catch((err) => console.error(err));

        if(res[0].channel){
            guild.channels.cache.get(res[0].channel).delete();
        }
    })
}

module.exports = {
    saveUserRoles,
    restoreUserRoles
}