const client = require("..");
const con = require('../function/db')

async function saveUserRoles(userId, chId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = guild.members.cache.get(userId);

    const roles = member.roles.cache.map((role) => role.id);
    const roleJson = JSON.stringify(roles);
    const sql = `INSERT INTO user_roles (user, roles, channel) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE roles = ?`
    try {
        await con.execute(sql, [member.id, roleJson, chId, roleJson]);
        console.log(`${member.user.username} roles saved to DB:`, roleJson);
    } catch (err) {
        console.error('Error with DB:', err);
    }
}

async function restoreUserRoles(userId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = guild.members.cache.get(userId);

    try {
        const [rows] = await con.execute(`SELECT * FROM user_roles WHERE user=?`, [member.id]);
        const rolesJson = rows[0]?.roles;

        if(!rolesJson){
            console.log(`No roles found`)
            return;
        }

        const roles = JSON.parse(rolesJson);

        member.roles.set(roles).catch((err) => console.error(err));

        if(rows[0].channel){
            guild.channels.cache.get(rows[0].channel).delete();
        }
    } catch (err) {
        console.error('Error restoring user roles:', err);
    }
}

module.exports = {
    saveUserRoles,
    restoreUserRoles
}