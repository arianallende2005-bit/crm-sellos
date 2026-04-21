const sharp = require('sharp');
const path = require('path');

const svgCode = `
<svg width="200" height="60" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="60" fill="#f0f0f0" rx="10"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#333">LOGO EMPRESA</text>
</svg>
`;

const outputPath = path.join(__dirname, '../frontend/public/logo.png');

sharp(Buffer.from(svgCode))
    .png()
    .toFile(outputPath)
    .then(() => console.log('Logo created'))
    .catch(err => console.error(err));
