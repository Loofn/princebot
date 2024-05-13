var mysql = require('mysql');
var connection = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("DATABASE CONNECTION SUCCESSFUL ✅");
});

module.exports = connection;