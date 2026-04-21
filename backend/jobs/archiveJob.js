const cron = require('node-cron');
const pool = require('../config/database');

/**
 * Archive orders that have been in "enviado" status for 30+ days
 * Runs daily at 2:00 AM
 */
function initializeArchiveJob() {
    // Schedule: Run every day at 2:00 AM
    // Format: second minute hour day month weekday
    cron.schedule('0 2 * * *', async () => {
        console.log('🔄 Running archive job...');

        try {
            const client = await pool.connect();

            try {
                // Archive orders in "enviado" status for 30+ days
                const archiveResult = await client.query(`
          UPDATE orders
          SET is_archived = true, archived_date = CURRENT_TIMESTAMP
          WHERE current_status = 'enviado'
            AND is_archived = false
            AND created_at < NOW() - INTERVAL '30 days'
          RETURNING id, product_name
        `);

                if (archiveResult.rows.length > 0) {
                    console.log(`✅ Archived ${archiveResult.rows.length} orders:`);
                    archiveResult.rows.forEach(order => {
                        console.log(`   - Order #${order.id}: ${order.product_name}`);
                    });
                } else {
                    console.log('ℹ️  No orders to archive');
                }

                // Note: We're not deleting archived orders, just marking them
                // In a production system, you might want to soft-delete orders
                // that have been archived for more than 60 days
                // This can be added as an additional step if needed

            } catch (error) {
                console.error('❌ Error in archive job:', error);
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('❌ Database connection error in archive job:', error);
        }
    });

    console.log('✅ Archive job scheduled (runs daily at 2:00 AM)');
}

/**
 * Manual function to run archive job immediately (for testing)
 */
async function runArchiveJobNow() {
    console.log('🔄 Running archive job manually...');

    try {
        const client = await pool.connect();

        try {
            const archiveResult = await client.query(`
        UPDATE orders
        SET is_archived = true, archived_date = CURRENT_TIMESTAMP
        WHERE current_status = 'enviado'
          AND is_archived = false
          AND created_at < NOW() - INTERVAL '30 days'
        RETURNING id, product_name
      `);

            console.log(`✅ Archived ${archiveResult.rows.length} orders`);
            return archiveResult.rows;

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Error running archive job:', error);
        throw error;
    }
}

module.exports = {
    initializeArchiveJob,
    runArchiveJobNow
};
