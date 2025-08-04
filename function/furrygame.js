const con = require('./db')

async function givePoints(userId, points){
    await con.execute(`UPDATE user_points SET points=points+? WHERE user=?`, [points, userId]);
}

async function removePoints(userId, points){
    await con.execute(`UPDATE user_points SET points=points-? WHERE user=?`, [points, userId]);
}

async function setPoints(userId, points){
    await con.execute(`UPDATE user_points SET points=? WHERE user=?`, [points, userId]);
}

async function getPoints(userId){
    const [rows] = await con.execute(`SELECT * FROM user_points WHERE user=?`, [userId]);
    if(rows.length === 0){
        return 0;
    } else {
        return rows[0].points;
    }
}

module.exports = {
    givePoints,
    removePoints,
    getPoints,
    setPoints
}