const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const logoPath = path.join(assetsDir, 'logo.png');

const targets = ['icon.png', 'adaptive-icon.png', 'favicon.png'];

targets.forEach(target => {
  const targetPath = path.join(assetsDir, target);
  try {
    fs.copyFileSync(logoPath, targetPath);
    console.log(`Successfully replaced ${target} with a valid PNG copy of logo.png`);
  } catch (error) {
    console.error(`Error copying to ${target}:`, error.message);
  }
});
