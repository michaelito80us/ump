import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(process.cwd(), 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Simple SVG template for UMP icon
const createSVG = (size: number) =>
  `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0066EE" rx="${size * 0.1}"/>
  <circle cx="${size * 0.5}" cy="${size * 0.3}" r="${size * 0.15}" fill="white"/>
  <rect x="${size * 0.2}" y="${size * 0.5}" width="${size * 0.6}" height="${size * 0.08}" fill="white" rx="${size * 0.02}"/>
  <rect x="${size * 0.25}" y="${size * 0.65}" width="${size * 0.5}" height="${size * 0.06}" fill="white" rx="${size * 0.015}"/>
  <text x="${size * 0.5}" y="${size * 0.85}" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold">UMP</text>
</svg>
`.trim();

// Generate placeholder icons
sizes.forEach((size) => {
  const svg = createSVG(size);
  const svgFilename = `icon-${size}x${size}.svg`;

  // Save SVG version (for development)
  fs.writeFileSync(path.join(iconsDir, svgFilename), svg);

  console.log(`Generated ${svgFilename}`);
});

console.log('Icon generation complete! SVG placeholders created.');
console.log(
  'Note: For production, convert SVGs to PNG using a tool like sharp or imagemagick.'
);
