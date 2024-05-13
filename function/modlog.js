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

    con.query(sql, [userId, action.toUpperCase(), moderator, comment, date]);
}

async function getModlogs(userId){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM modlogs WHERE user='${userId}'`, function (err, res){
            if(res.length > 0){
                resolve(res);
            } else {
                resolve(null)
            }
        })
    })
}

module.exports = {
    addModlog,
    getModlogs
}