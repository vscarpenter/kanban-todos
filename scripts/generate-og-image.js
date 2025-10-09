const fs = require('fs');
const { createCanvas } = require('canvas');

// Create canvas at OG image size
const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Create gradient background
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#8B5CF6');
gradient.addColorStop(1, '#6D28D9');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Add subtle pattern overlay
ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
for (let x = 20; x < width; x += 40) {
  for (let y = 20; y < height; y += 40) {
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw icon background (centered at x=500, y=200)
const iconX = 440;
const iconY = 140;
const iconSize = 120;
ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
ctx.beginPath();
ctx.roundRect(iconX, iconY, iconSize, iconSize, 24);
ctx.fill();

// Draw cascade steps
// First step (smallest)
ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
ctx.beginPath();
ctx.roundRect(iconX + 20, iconY + 20, 24, 24, 4);
ctx.fill();

// Second step (medium)
ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
ctx.beginPath();
ctx.roundRect(iconX + 48, iconY + 48, 30, 24, 4);
ctx.fill();

// Third step (largest)
ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
ctx.beginPath();
ctx.roundRect(iconX + 70, iconY + 72, 34, 24, 4);
ctx.fill();

// Draw app name
ctx.fillStyle = 'white';
ctx.font = 'bold 72px -apple-system, system-ui, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Cascade', width / 2, 330);

// Draw tagline
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.font = '32px -apple-system, system-ui, sans-serif';
ctx.fillText('Privacy-First Task Management', width / 2, 390);

// Draw feature badges
const badgeY = 450;
const badgeHeight = 48;
const badgeRadius = 24;
const badges = [
  { text: '🔒 Private', x: 370 },
  { text: '📋 Kanban', x: 530 },
  { text: '♿ A11y', x: 690 },
  { text: '⚡ Fast', x: 850 }
];

badges.forEach(badge => {
  // Badge background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(badge.x - 70, badgeY, 140, badgeHeight, badgeRadius);
  ctx.fill();

  // Badge text
  ctx.fillStyle = 'white';
  ctx.font = '600 18px -apple-system, system-ui, sans-serif';
  ctx.fillText(badge.text, badge.x, badgeY + 30);
});

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/Users/vinnycarpenter/Projects/kanban-todos/public/images/og-image.png', buffer);

console.log('OG image generated successfully!');
