var mysql = require('mysql');

// Create connection pool instead of single connection for better reliability
var pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'muttbot',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    // Connection timeout settings
    idleTimeout: 300000, // 5 minutes
    idleTimeoutMillis: 300000,
    max: 50,
    // Keep connection alive
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    keepAliveDelay: 0
});

// Debug: Log connection config (without password)
console.log('🔗 Creating MySQL connection pool to:');
console.log('Host:', process.env.MYSQL_HOST || 'localhost');
console.log('Port:', process.env.MYSQL_PORT || 3306);
console.log('User:', process.env.MYSQL_USER || 'root');
console.log('Database:', process.env.MYSQL_DB || 'muttbot');

// Test initial connection
pool.getConnection(function(err, connection) {
    if (err) {
        console.error("❌ DATABASE CONNECTION FAILED:");
        console.error("Error Code:", err.code);
        console.error("Error Message:", err.message);
        console.error("Host:", process.env.MYSQL_HOST || 'localhost');
        console.error("User:", process.env.MYSQL_USER || 'root');
        console.error("Database:", process.env.MYSQL_DB || 'muttbot');
        console.error("\n🔧 TROUBLESHOOTING STEPS:");
        console.error("1. Check if MySQL server is running: sudo systemctl status mysql");
        console.error("2. Start MySQL if stopped: sudo systemctl start mysql");
        console.error("3. Verify your environment variables in .env file");
        console.error("4. Check MySQL user permissions");
        console.error("5. Ensure the database exists");
        
        // Don't crash the entire bot, just log the error
        console.error("\n⚠️  Bot will continue without database functionality");
        return;
    }
    
    console.log("DATABASE CONNECTION POOL SUCCESSFUL ✅");
    console.log(`Connection pool created with ${pool.config.connectionLimit} max connections`);
    
    // Release the test connection back to pool
    connection.release();
});

// Handle pool errors
pool.on('connection', function (connection) {
    console.log('New connection established as id ' + connection.threadId);
});

pool.on('error', function(err) {
    console.error('DATABASE POOL ERROR:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Connection lost, pool will handle reconnection automatically');
    } else {
        console.error('Database pool error:', err);
    }
});

// Keep-alive function to prevent connection timeouts
function keepAlive() {
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error('Keep-alive connection error:', err);
            return;
        }
        
        connection.query('SELECT 1', function(err, result) {
            if (err) {
                console.error('Keep-alive query error:', err);
            } else {
                console.log('📡 Database keep-alive ping successful');
            }
            connection.release();
        });
    });
}

// Set up keep-alive interval - ping every 4 minutes (before 5 minute MySQL timeout)
setInterval(keepAlive, 240000); // 4 minutes

// Initial keep-alive after 1 minute
setTimeout(keepAlive, 60000);

module.exports = pool;