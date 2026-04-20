# Android Adaptive Icon Guide for Eco Sudar

## The Problem
Your logo appears zoomed in because Android adaptive icons require specific sizing with a safe zone.

## Solution: Create an Adaptive Icon

### Option 1: Use Online Tool (Easiest)
1. Go to: https://easyappicon.com/ or https://icon.kitchen/
2. Upload your `assets/images/logo.png`
3. Select "Android Adaptive Icon"
4. Adjust the padding/size so your logo is centered with space around it
5. Download the generated `adaptive-icon.png` (1024x1024)
6. Save it as `assets/images/adaptive-icon.png`

### Option 2: Manual Creation (Using Image Editor)
1. Create a new 1024x1024 transparent PNG
2. Place your logo in the center, sized to about 60-70% of the canvas
3. Leave transparent space around the edges (safe zone)
4. Save as `assets/images/adaptive-icon.png`

### Important Guidelines:
- **Canvas Size**: 1024x1024 pixels
- **Safe Zone**: Keep important content within the center 66% (684x684 pixels)
- **Format**: PNG with transparent background
- **Logo Size**: Your logo should be 60-70% of the canvas size (centered)
- **Padding**: Leave at least 15-20% transparent space on all sides

### Visual Guide:
```
┌─────────────────────────────────┐
│                                 │  ← Transparent padding
│     ┌───────────────────┐       │
│     │                   │       │
│     │    YOUR LOGO      │       │  ← Logo centered, 60-70% size
│     │                   │       │
│     └───────────────────┘       │
│                                 │  ← Transparent padding
└─────────────────────────────────┘
```

## After Creating the Adaptive Icon:

1. Save the file as `assets/images/adaptive-icon.png`
2. Rebuild your APK:
   ```bash
   eas build --platform android --profile preview
   ```

## Current Configuration:
Your `app.json` has been updated to use:
- **Adaptive Icon**: `./assets/images/adaptive-icon.png`
- **Background Color**: White (#ffffff)

## Alternative: Quick Fix with Padding
If you want a quick solution, you can also add padding to the adaptive icon config:

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/logo.png",
    "backgroundColor": "#ffffff",
    "monochromeImage": "./assets/images/logo.png"
  }
}
```

But creating a properly sized adaptive-icon.png is the recommended approach.

## Testing:
After rebuilding, your logo will appear properly sized and centered on:
- Home screen
- App drawer
- Settings
- All Android launcher variations (circle, square, rounded square, etc.)