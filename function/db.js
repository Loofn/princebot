var mysql = require('mysql2/promise');

// Create connection pool with very conservative MySQL2-compatible settings
var pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB || 'muttbot',
    
    // Connection pool settings
    connectionLimit: 5,  // Reduced from 10
    queueLimit: 0,
    
    // Very aggressive timeout settings for problematic connections
    connectTimeout: 10000,  // 10 seconds max to connect
    acquireTimeout: 10000,  // 10 seconds to get connection from pool
    
    // Keep connections alive but not too long
    idleTimeout: 300000,    // 5 minutes idle timeout (reduced from 15)
    
    // MySQL2 specific options
    charset: 'utf8mb4',
    
    // Simple connection behavior
    reconnect: true,
    multipleStatements: false,
    
    // Additional safety options
    dateStrings: false,
    debug: false
});

// Debug: Log connection config (without password)
console.log('🔗 Creating MySQL connection pool to:');
console.log('Host:', process.env.MYSQL_HOST || 'localhost');
console.log('Port:', process.env.MYSQL_PORT || 3306);
console.log('User:', process.env.MYSQL_USER || 'root');
console.log('Database:', process.env.MYSQL_DB || 'muttbot');

// Test initial connection with promise-based approach
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log("DATABASE CONNECTION POOL SUCCESSFUL ✅");
        console.log(`Connection pool created with 10 max connections`);
        connection.release();
    } catch (err) {
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
        console.error("6. Check firewall settings if using remote MySQL");
        console.error("7. Test connection manually: mysql -h HOST -u USER -p DATABASE");
        
        // Don't crash the entire bot, just log the error
        console.error("\n⚠️  Bot will continue without database functionality");
    }
}

// Test connection on startup
testConnection();

// Handle pool events with better error handling
pool.on('connection', function (connection) {
    console.log('🔗 New connection established as id ' + connection.threadId);
});

pool.on('error', function(err) {
    console.error('DATABASE POOL ERROR:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Connection lost, pool will handle reconnection automatically');
    } else if (err.code === 'ETIMEDOUT') {
        console.log('⏰ Connection timed out, pool will retry');
    } else if (err.code === 'ECONNREFUSED') {
        console.log('🚫 Connection refused, check if MySQL server is running');
    } else {
        console.error('💥 Unexpected database pool error:', err);
    }
});

// Improved keep-alive function with better error handling
async function keepAlive() {
    try {
        const connection = await pool.getConnection();
        
        try {
            const [rows] = await connection.execute('SELECT 1 as ping');
            console.log('📡 Database keep-alive ping successful');
        } catch (queryErr) {
            console.error('Keep-alive query error:', queryErr);
        } finally {
            connection.release();
        }
    } catch (err) {
        if (err.code === 'ETIMEDOUT') {
            console.error('⏰ Keep-alive connection timeout - MySQL server may be overloaded');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('� Keep-alive connection refused - MySQL server may be down');
        } else {
            console.error('❌ Keep-alive connection error:', err.code, err.message);
        }
    }
}

// Reduced keep-alive interval - ping every 2 minutes instead of 4
setInterval(keepAlive, 120000); // 2 minutes

// Initial keep-alive after 30 seconds instead of 1 minute
setTimeout(keepAlive, 30000);

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('🔌 Closing database connections...');
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔌 Closing database connections...');
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
});

// Export the promise-based pool directly
module.exports = pool;