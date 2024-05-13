const con = require('../db')

async function hasRoleRequest(userId){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM rolerequest WHERE user='${userId}'`, function (err, res){
            if(res.length > 0){
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

module.exports = hasRoleRequest;