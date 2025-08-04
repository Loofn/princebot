const con = require('../db')

async function hasRoleRequest(userId){
    const [rows] = await con.execute(`SELECT * FROM rolerequest WHERE user=?`, [userId]);
    return rows.length > 0;
}

module.exports = hasRoleRequest;