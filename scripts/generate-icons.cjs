const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG dimensions and drawing commands
const VIEWBOX_SIZE = 24;
const RECT = { x: 3, y: 3, width: 18, height: 18, rx: 2 };
const STROKE_COLOR = '#4f46e5';
const STROKE_WIDTH = 1.5;
const DASHES = [
    // Each dash: [startX, startY, length]
    [8, 8, 2],
    [8, 12, 2],
    [8, 16, 2],
    [14, 8, 2],
    [14, 12, 2],
    [14, 16, 2]
];

// Helper to draw rounded rectangle
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawIcon(ctx, size) {
    const scale = size / VIEWBOX_SIZE;
    const lineWidth = STROKE_WIDTH * scale;

    // Clear with transparent background
    ctx.clearRect(0, 0, size, size);

    // Draw rounded rectangle
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    const rect = {
        x: RECT.x * scale,
        y: RECT.y * scale,
        width: RECT.width * scale,
        height: RECT.height * scale,
        rx: RECT.rx * scale
    };

    // Draw rounded rect
    roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, rect.rx);
    ctx.fill();
    ctx.stroke();

    // Draw dashes
    ctx.beginPath();
    for (const [sx, sy, len] of DASHES) {
        const x = sx * scale;
        const y = sy * scale;
        const length = len * scale;
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y);
    }
    ctx.stroke();
}

// Ensure public/icons directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons for each size
sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    drawIcon(ctx, size);

    const buffer = canvas.toBuffer('image/png');
    const filename = `icon-${size}x${size}.png`;
    const filepath = path.join(iconsDir, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`Generated ${filename}`);
});

console.log('All icons generated successfully!');