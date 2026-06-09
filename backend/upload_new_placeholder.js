const fs = require('fs');
const supabase = require('./config/supabase');

async function upload() {
    try {
        const fileBuffer = fs.readFileSync('../frontend/public/placeholder.png');
        const { data, error } = await supabase.storage
            .from('images')
            .upload('orders/default_placeholder_v2.png', fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });
            
        if (error) {
            console.error('Error:', error);
        } else {
            const { data: urlData } = supabase.storage.from('images').getPublicUrl('orders/default_placeholder_v2.png');
            console.log('Public URL:', urlData.publicUrl);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}
upload();
