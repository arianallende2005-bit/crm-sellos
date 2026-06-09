const bcrypt = require('bcrypt');
const { Client } = require('pg');

const client = new Client({
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.otuorchtbfodduxtxrtg',
    password: 'tLBqU52uyHGfxILB',
    ssl: { rejectUnauthorized: false }
});

async function updateMontajeUser() {
  try {
    await client.connect();
    const username = 'montaje';
    const plainPassword = 'central1610';
    const email = 'montaje@crm-sellos.com';
    const fullName = 'Operador Montaje';
    const role = 'operador';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Check if the role 'operador' exists in the ENUM type first just in case
    // (Assuming schema.sql has already run in production or we'll assume it exists based on our inspection)

    // Check if user exists
    const checkQuery = 'SELECT id FROM users WHERE username = $1';
    const checkRes = await client.query(checkQuery, [username]);

    if (checkRes.rows.length > 0) {
      // Update existing user
      const updateQuery = `
        UPDATE users 
        SET password = $1, role = $2, full_name = $3, email = $4 
        WHERE username = $5
      `;
      await client.query(updateQuery, [hashedPassword, role, fullName, email, username]);
      console.log('✓ Usuario montaje actualizado exitosamente con rol operador.');
    } else {
      // Insert new user
      const insertQuery = `
        INSERT INTO users (username, password, email, full_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
      `;
      await client.query(insertQuery, [username, hashedPassword, email, fullName, role]);
      console.log('✓ Usuario montaje creado exitosamente con rol operador.');
    }

  } catch (error) {
    console.error('❌ Error updating/creating user:', error);
  } finally {
    await client.end();
  }
}

updateMontajeUser();
