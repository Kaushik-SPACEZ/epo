const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function preparePlayStoreIcon() {
  const inputPath = path.join(__dirname, '../assets/images/logo-new.png');
  const outputPath = path.join(__dirname, '../play-store-assets/icon-512x512.png');
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error('❌ Error: logo-new.png not found at', inputPath);
      console.log('Please ensure your logo file exists at assets/images/logo-new.png');
      return;
    }

    // Get input image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`📊 Input image: ${metadata.width}x${metadata.height} pixels`);

    // Resize to 512x512 with padding to maintain aspect ratio
    await sharp(inputPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
      })
      .png()
      .toFile(outputPath);

    console.log('✅ Play Store icon created successfully!');
    console.log(`📁 Output: ${outputPath}`);
    console.log('📐 Size: 512x512 pixels');
    console.log('\n✨ Your icon is ready for Play Store submission!');
  } catch (error) {
    console.error('❌ Error creating Play Store icon:', error.message);
  }
}

preparePlayStoreIcon();