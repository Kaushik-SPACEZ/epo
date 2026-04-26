const sharp = require('sharp');
const path = require('path');

async function addPaddingToLogo() {
  const inputPath = path.join(__dirname, '../assets/images/logo-new.png');
  const outputPath = path.join(__dirname, '../assets/images/logo-new-padded.png');

  try {
    // Read the original image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Calculate new dimensions with 15% padding on all sides
    const paddingPercent = 0.15;
    const newWidth = Math.round(metadata.width * (1 + paddingPercent * 2));
    const newHeight = Math.round(metadata.height * (1 + paddingPercent * 2));
    
    // Create image with padding
    await image
      .resize(metadata.width, metadata.height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .extend({
        top: Math.round(metadata.height * paddingPercent),
        bottom: Math.round(metadata.height * paddingPercent),
        left: Math.round(metadata.width * paddingPercent),
        right: Math.round(metadata.width * paddingPercent),
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(outputPath);
    
    console.log('✅ Successfully created logo with padding!');
    console.log(`   Input: ${inputPath}`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Original size: ${metadata.width}x${metadata.height}`);
    console.log(`   New size: ${newWidth}x${newHeight}`);
    console.log('\nNext step: Update app.json to use "logo-new-padded.png" instead of "logo-new.png"');
  } catch (error) {
    console.error('❌ Error processing image:', error.message);
    console.log('\nMake sure sharp is installed: npm install sharp');
  }
}

addPaddingToLogo();