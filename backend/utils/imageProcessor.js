const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Compress and optimize uploaded images
 * @param {string} inputPath - Path to original image
 * @param {number} maxWidth - Maximum width (maintains aspect ratio)
 * @param {number} quality - JPEG/WebP quality (1-100)
 * @returns {Promise<string>} Path to optimized image
 */
async function compressImage(inputPath, maxWidth = 1200, quality = 85) {
    try {
        const ext = path.extname(inputPath).toLowerCase();
        const outputPath = inputPath.replace(ext, '-optimized' + ext);

        // Get image metadata
        const metadata = await sharp(inputPath).metadata();

        // Only resize if image is larger than maxWidth
        let transformer = sharp(inputPath);

        if (metadata.width > maxWidth) {
            transformer = transformer.resize(maxWidth, null, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Apply compression based on format
        if (ext === '.jpg' || ext === '.jpeg') {
            transformer = transformer.jpeg({ quality });
        } else if (ext === '.png') {
            transformer = transformer.png({ quality });
        } else if (ext === '.webp') {
            transformer = transformer.webp({ quality });
        }

        // Save optimized image
        await transformer.toFile(outputPath);

        // Delete original file
        fs.unlinkSync(inputPath);

        // Rename optimized file to original name
        fs.renameSync(outputPath, inputPath);

        return inputPath;

    } catch (error) {
        console.error('Error compressing image:', error);
        // If compression fails, return original path
        return inputPath;
    }
}

/**
 * Delete an image file
 * @param {string} imagePath - Path to image to delete
 */
function deleteImage(imagePath) {
    try {
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting image:', error);
        return false;
    }
}

module.exports = {
    compressImage,
    deleteImage
};
