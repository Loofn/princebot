const con = require('../function/db');
const moment = require('moment');

/**
 * Add entry to moderator logs
 * @param {String} userId - User ID of the offender
 * @param {String} action - Action type
 * @param {String} moderator - Moderator's user ID
 * @param {String} [comment] - Additional comment
 * @returns {void}
 */
async function addModlog(userId, action, moderator, comment="NULL"){

    const sql = `INSERT INTO modlogs (user, action, moderator, comment, date) VALUES (?, ?, ?, ?, ?)`;
    const date = moment().format("YYYY-MM-DD HH:mm:ss");

    await con.execute(sql, [userId, action.toUpperCase(), moderator, comment, date]);
}

async function getModlogs(userId){
    const [rows] = await con.execute(`SELECT * FROM modlogs WHERE user=?`, [userId]);
    if(rows.length > 0){
        return rows;
    } else {
        return null;
    }
}

module.exports = {
    addModlog,
    getModlogs
}