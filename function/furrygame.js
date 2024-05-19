const con = require('./db')

function givePoints(userId, points){
    con.query(`UPDATE user_points SET points=points+${points} WHERE user='${userId}'`)
}

function removePoints(userId, points){
    con.query(`UPDATE user_points SET points=points-${points} WHERE user='${userId}'`)
}

async function getPoints(userId){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM user_points WHERE user='${userId}'`, function(err, res){
            if(res.length === 0){
                resolve(0)
            } else {
                resolve(res[0].points)
            }
        })
    })
}

module.exports = {
    givePoints,
    removePoints,
    getPoints
}