import fs from 'fs';
import path from 'path';

// Create a simple script to convert our SVG icons to PNG format
// For now, we'll create simple colored squares as PNG placeholders

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(process.cwd(), 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create simple PNG data (1x1 blue pixel in base64)
const bluePngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA60e6kgAAAABJRU5ErkJggg==';

sizes.forEach((size) => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);

  // Create a simple colored square PNG
  const pngData = Buffer.from(bluePngBase64, 'base64');
  fs.writeFileSync(filepath, pngData);

  console.log(`Created ${filename}`);
});

console.log('PNG icons created successfully!');
