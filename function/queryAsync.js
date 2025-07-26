// Utility to promisify MySQL queries
module.exports = function queryAsync(con, sql, params) {
    return new Promise((resolve, reject) => {
        con.query(sql, params, (err, res) => {
            if (err) reject(err);
            else resolve(res);
        });
    });
};
