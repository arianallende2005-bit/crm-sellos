const { Client } = require('pg');

const client = new Client({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.otuorchtbfodduxtxrtg',
    password: 'tLBqU52uyHGfxILB',
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => {
        console.log('✅ Success! Connected directly with connection string!');
        return client.query('SELECT current_user, current_database();');
    })
    .then(res => {
        console.log(res.rows[0]);
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Failed:', err.message);
        process.exit(1);
    });
