const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { saltRounds } = require('../config/auth');

/**
 * Initialize the database with schema and default admin user
 */
async function initializeDatabase() {
    const client = await pool.connect();

    try {
        console.log('🔄 Initializing database...');

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Generate proper hashed password for default admin
        const defaultPassword = 'cambiarme123';
        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

        // Replace placeholder password with actual hash
        schemaSql = schemaSql.replace(
            '$2b$10$rK8qF5xN.mYXJK5vN5YGOuXxLxJxN5Xx5xX5Xx5Xx5Xx5Xx5Xx5Xx',
            hashedPassword
        );

        // Execute the schema
        await client.query(schemaSql);

        console.log('✅ Database schema created successfully');
        console.log('✅ Default admin user created');
        console.log('   Username: admin');
        console.log('   Password: cambiarme123');
        console.log('   ⚠️  Please change this password immediately!');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run initialization
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('✅ Database initialization complete');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        });
}

module.exports = initializeDatabase;
