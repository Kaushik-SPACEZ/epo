    # Quick Build Reference - Eco Sudar

## Current Build Status
✅ **Build In Progress**
- Version Code: 3 (auto-incremented)
- Build Type: AAB (Android App Bundle)
- Platform: Android
- Profile: Production
- Status: Uploading and compiling

## Monitor Build Progress

### Option 1: EAS Dashboard (Recommended)
🔗 https://expo.dev/accounts/kaushik2004/projects/eco-sudar/builds

### Option 2: Command Line
```bash
# List all builds
eas build:list

# View specific build details
eas build:view <BUILD_ID>
```

### Option 3: Terminal
The build is running in the background. Check the terminal output for real-time updates.

## What Happens Next

### During Build (10-20 minutes)
1. ✅ Project files uploaded
2. ⏳ Dependencies installation
3. ⏳ Native code compilation
4. ⏳ AAB generation
5. ⏳ Build completion

### After Build Completes
You'll receive:
- ✅ Download link for AAB file
- ✅ Build ID
- ✅ Success/failure notification

## Quick Actions After Build

### Download Your AAB
```bash
# List builds to get BUILD_ID
eas build:list

# Download the AAB
eas build:download --id <BUILD_ID>
```

### Submit to Play Store (Manual)
1. Go to https://play.google.com/console
2. Navigate to your app
3. Go to "Release" > "Production"
4. Upload the AAB file
5. Add release notes
6. Submit for review

### Submit to Play Store (Automated with EAS)
```bash
# First, set up Google Service Account (one-time setup)
# Then run:
eas submit --platform android --profile production
```

## Important Files

- **app.json** - App configuration
- **eas.json** - Build configuration
- **PLAY_STORE_BUILD_GUIDE.md** - Complete guide
- **google-service-account.json** - For automated submission (create this)

## Common Commands

```bash
# Build commands
eas build --platform android --profile production  # Production build
eas build --platform android --profile preview     # Preview APK

# Build management
eas build:list                    # List all builds
eas build:view <BUILD_ID>         # View build details
eas build:download --id <BUILD_ID> # Download build
eas build:cancel <BUILD_ID>       # Cancel running build

# Submission
eas submit --platform android     # Submit to Play Store

# Credentials
eas credentials                   # Manage signing credentials

# Project info
eas whoami                        # Check logged in user
eas project:info                  # View project details
```

## Build Profiles Explained

### Production (Current)
- **Purpose**: Play Store release
- **Output**: AAB (Android App Bundle)
- **Auto-increment**: Yes
- **Distribution**: Store

### Preview
- **Purpose**: Testing
- **Output**: APK (installable file)
- **Distribution**: Internal

### Development
- **Purpose**: Development testing
- **Output**: Development client
- **Distribution**: Internal

## Troubleshooting

### If Build Fails
1. Check build logs in EAS dashboard
2. Review error messages
3. Fix issues in code
4. Run build again

### Common Issues
- **Missing dependencies**: Check package.json
- **Configuration errors**: Verify app.json and eas.json
- **Asset issues**: Ensure all images exist
- **Native module conflicts**: Check compatibility

## Next Steps After Successful Build

1. ✅ Download AAB file
2. ✅ Test on device (optional)
3. ✅ Create Play Console account (if not done)
4. ✅ Prepare store listing assets
5. ✅ Upload to Play Store
6. ✅ Submit for review
7. ✅ Wait for approval (1-3 days)

## Store Listing Requirements

### Required Assets
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] At least 2 screenshots
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL
- [ ] Content rating

### Required Information
- [ ] App category
- [ ] Contact email
- [ ] Target audience
- [ ] Data safety information

## Support Resources

- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **Play Console**: https://play.google.com/console
- **Your Dashboard**: https://expo.dev/accounts/kaushik2004
- **Expo Forums**: https://forums.expo.dev/

## Build Timeline

**Typical Timeline:**
- Upload: 1-2 minutes ✅
- Build: 10-20 minutes ⏳
- Download: 1 minute
- Play Store Review: 1-3 days

**Current Status:** Build in progress - check terminal or dashboard for updates

---

**Pro Tip:** While waiting for the build, prepare your Play Store listing assets (screenshots, descriptions, etc.) to save time later!