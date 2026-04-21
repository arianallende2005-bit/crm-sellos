const { Client } = require('pg');

async function test() {
    const passwords = ['tLBqU52uyHGfxILB'];
    const users = ['postgres.otuorchtbfodduxtxrtg', 'postgres'];
    const regions = ['sa-east-1'];

    for (let i = 0; i <= 5; i++) {
        for (const region of regions) {
            for (const p of passwords) {
                for (const u of users) {
                    const host = `aws-${i}-${region}.pooler.supabase.com`;
                    console.log(`Trying ${host} with user ${u}`);
                    const client = new Client({
                        host,
                        port: 5432,
                        database: 'postgres',
                        user: u,
                        password: p,
                        ssl: { rejectUnauthorized: false }
                    });

                    try {
                        await client.connect();
                        console.log(`✅ Connected successfully to ${host} with user ${u}`);
                        await client.end();
                        return;
                    } catch (e) {
                        console.log(`❌ Failed ${host} with user ${u}: ${e.message}`);
                    }
                }
            }
        }
    }
}

test();
