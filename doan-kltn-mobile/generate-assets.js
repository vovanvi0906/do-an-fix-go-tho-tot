const fs = require('fs');
const path = require('path');

// 1x1 valid PNG base64
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPifAQAE+wHBrwJ5WAAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

const files = [
  path.join(__dirname, 'assets', 'icons', 'icon.png'),
  path.join(__dirname, 'assets', 'icons', 'adaptive-icon.png'),
  path.join(__dirname, 'assets', 'icons', 'favicon.png'),
  path.join(__dirname, 'assets', 'images', 'splash-icon.png'),
];

files.forEach(f => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, pngBuffer);
  console.log('Created asset:', f);
});
