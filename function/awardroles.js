const client = require("..");
const con = require('../function/db')

async function awardCumRole(){
    const guild = client.guilds.cache.get('1231299437519966269');
    const roleId = '1398386756822499390'; // Replace with your actual role ID

    con.query(`SELECT * FROM cumcount ORDER BY count DESC`, async function (err, res) {
        if (err) {
            console.error('Database error:', err);
            return;
        }
        if (res.length === 0) return;

        const topUser = res[0];
        const topUserId = topUser.user;

        // Remove role from all members who currently have it
        const role = guild.roles.cache.get(roleId);
        if (!role) {
            console.error('Role not found');
            return;
        }

        // Fetch all members with the role
        await guild.members.fetch(); // Ensure members are cached
        role.members.forEach(async member => {
            if (member.id !== topUserId) {
                await member.roles.remove(roleId).catch(console.error);
            }
        });

        // Award role to top user
        const topMember = guild.members.cache.get(topUserId);
        if (topMember && !topMember.roles.cache.has(roleId)) {
            await topMember.roles.add(roleId).catch(console.error);
        }
    });
}

module.exports = awardCumRole;