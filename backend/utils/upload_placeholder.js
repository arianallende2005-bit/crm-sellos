const fs = require('fs');
const path = require('path');
const supabase = require('../config/supabase');

async function uploadPlaceholder() {
    try {
        console.log('🔄 Uploading default placeholder to Supabase Storage...');
        const localPath = path.join(__dirname, '../../frontend/public/placeholder.png');
        if (!fs.existsSync(localPath)) {
            throw new Error(`Local file not found at: ${localPath}`);
        }

        const fileBuffer = fs.readFileSync(localPath);
        
        const { data, error } = await supabase.storage
            .from('images')
            .upload('orders/placeholder.png', fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            throw error;
        }

        const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl('orders/placeholder.png');

        console.log('✅ Default placeholder uploaded successfully!');
        console.log('🔗 Public URL:', publicUrlData.publicUrl);

    } catch (error) {
        console.error('❌ Error uploading placeholder:', error);
        process.exit(1);
    }
}

uploadPlaceholder().then(() => process.exit(0));
