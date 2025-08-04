// Utility for MySQL queries with mysql2/promise
module.exports = async function queryAsync(con, sql, params = []) {
    try {
        // For mysql2/promise, we need to handle the response properly
        const [rows, fields] = await con.execute(sql, params);
        return rows;
    } catch (err) {
        console.error('Query error:', err);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw err;
    }
};
