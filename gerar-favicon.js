const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, 'LOGO CSM Velho Vetor.png');

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

(async () => {
  for (const { name, size } of sizes) {
    await sharp(src)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(__dirname, name));
    console.log(`✓ ${name}`);
  }

  // ICO = 32x32 renomeado (browsers aceitam PNG dentro do .ico em maioria)
  await sharp(src)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, 'favicon.ico'));
  console.log('✓ favicon.ico');

  console.log('\nFavicons gerados com sucesso!');
})();
