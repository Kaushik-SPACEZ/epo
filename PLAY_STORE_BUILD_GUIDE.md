# Play Store Build Guide for Eco Sudar

## Overview
This guide covers the complete process of building your app with EAS and submitting it to the Google Play Store.

## Current Build Status

### Build Configuration
- **App Name**: Eco Sudar
- **Package Name**: com.ecosudar.app
- **Version**: 1.0.0
- **Build Type**: AAB (Android App Bundle) - Required for Play Store
- **EAS Project ID**: 92bf278f-4f03-4998-b450-1dee4c316a5b

### Build Command Running
```bash
eas build --platform android --profile production
```

The build is currently running in the background. This process typically takes 10-20 minutes.

## What's Happening During the Build

1. **Code Upload**: Your app code is being uploaded to EAS servers
2. **Dependency Installation**: All npm packages are being installed
3. **Native Code Compilation**: Android native code is being compiled
4. **App Signing**: EAS will handle app signing automatically (or prompt you to set it up)
5. **AAB Generation**: The final Android App Bundle (.aab) file is being created

## Monitoring Your Build

### Check Build Status
You can monitor your build progress in several ways:

1. **Terminal Output**: The command is running in the background, check the terminal for updates
2. **EAS Dashboard**: Visit https://expo.dev/accounts/kaushik2004/projects/eco-sudar/builds
3. **Command Line**: Run `eas build:list` to see all builds

### Build Completion
When the build completes, you'll receive:
- A download link for the AAB file
- Build ID and details
- Any warnings or errors that occurred

## After Build Completes

### 1. Download Your AAB File
```bash
# List recent builds
eas build:list

# Download a specific build
eas build:download --id <BUILD_ID>
```

Or download directly from the EAS dashboard.

### 2. Test Your Build (Optional but Recommended)
Before submitting to Play Store, you can test the AAB:

```bash
# Install on a connected device
adb install-multiple path/to/your-app.aab
```

Or use Google's bundletool:
```bash
# Generate APKs from AAB for testing
bundletool build-apks --bundle=app.aab --output=app.apks
bundletool install-apks --apks=app.apks
```

## Google Play Store Submission

### Prerequisites

1. **Google Play Console Account**
   - Create an account at https://play.google.com/console
   - Pay the one-time $25 registration fee
   - Complete account verification

2. **App Information Required**
   - App title: "Eco Sudar"
   - Short description (80 characters max)
   - Full description (4000 characters max)
   - App category
   - Content rating questionnaire
   - Privacy policy URL (required)
   - Contact email

3. **Store Listing Assets**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (minimum 2, up to 8):
     - Phone: 16:9 or 9:16 aspect ratio
     - Tablet: 16:9 or 9:16 aspect ratio (optional)
   - Promotional video (optional)

### Step-by-Step Submission Process

#### 1. Create App in Play Console
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: "Eco Sudar"
   - Default language: English (or your preference)
   - App or game: App
   - Free or paid: Free (or Paid)
4. Accept declarations and click "Create app"

#### 2. Set Up Store Listing
Navigate to "Store presence" > "Main store listing":

1. **App details**
   - App name: Eco Sudar
   - Short description: Brief tagline about your app
   - Full description: Detailed description of features

2. **Graphics**
   - Upload app icon (512x512)
   - Upload feature graphic (1024x500)
   - Upload at least 2 screenshots

3. **Categorization**
   - App category: Choose appropriate category
   - Tags: Add relevant tags

4. **Contact details**
   - Email: Your support email
   - Phone: Optional
   - Website: Optional

#### 3. Content Rating
1. Go to "Policy" > "App content"
2. Click "Start questionnaire"
3. Answer questions about your app's content
4. Submit for rating

#### 4. Privacy Policy
1. Go to "Policy" > "App content"
2. Add your privacy policy URL
3. If you don't have one, you can use a generator:
   - https://www.privacypolicygenerator.info/
   - https://app-privacy-policy-generator.firebaseapp.com/

#### 5. Upload Your AAB
1. Go to "Release" > "Production"
2. Click "Create new release"
3. Upload your AAB file (downloaded from EAS)
4. Add release notes describing what's new
5. Review and roll out

#### 6. Complete All Required Sections
Before you can publish, complete:
- [ ] Store listing
- [ ] Content rating
- [ ] Target audience
- [ ] News apps (if applicable)
- [ ] COVID-19 contact tracing (if applicable)
- [ ] Data safety
- [ ] Government apps (if applicable)
- [ ] Financial features (if applicable)
- [ ] Health (if applicable)

#### 7. Submit for Review
1. Review all sections for completeness
2. Click "Send for review"
3. Wait for Google's review (typically 1-3 days)

## Using EAS Submit (Automated Submission)

EAS can automate the submission process if you set up a service account:

### 1. Create Google Service Account
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google Play Android Developer API
4. Create service account credentials
5. Download JSON key file
6. Save as `google-service-account.json` in your project root

### 2. Grant Play Console Access
1. Go to Play Console > Settings > API access
2. Link your Google Cloud project
3. Grant access to the service account
4. Set permissions: "Release manager" or "Admin"

### 3. Submit via EAS
```bash
# Submit to internal testing track
eas submit --platform android --profile production

# Or specify track
eas submit --platform android --track internal
```

Available tracks:
- `internal` - Internal testing (up to 100 testers)
- `alpha` - Closed testing
- `beta` - Open testing
- `production` - Production release

## Post-Submission

### Review Process
- Google typically reviews apps within 1-3 days
- You'll receive email notifications about status
- Check Play Console for detailed feedback

### If Rejected
- Review rejection reasons carefully
- Make necessary changes
- Build new version with fixes
- Resubmit

### After Approval
- Your app will be live on Play Store
- Monitor crash reports and user feedback
- Plan regular updates

## Updating Your App

### For Future Updates
1. Update version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 2
       }
     }
   }
   ```

2. Build new version:
   ```bash
   eas build --platform android --profile production
   ```

3. Submit update:
   - Upload new AAB to Play Console
   - Add release notes
   - Roll out to production

## Troubleshooting

### Build Failures
- Check build logs in EAS dashboard
- Verify all dependencies are compatible
- Ensure app.json configuration is correct

### Signing Issues
- EAS handles signing automatically
- If prompted, follow EAS instructions to set up credentials
- You can manage credentials with: `eas credentials`

### Play Store Rejection
Common reasons:
- Missing privacy policy
- Incomplete store listing
- Content rating issues
- Policy violations
- Technical issues (crashes, bugs)

## Important Notes

1. **Version Management**: EAS auto-increments version codes with `"autoIncrement": true`
2. **Build Type**: Production builds use AAB format (required by Play Store)
3. **Signing**: EAS manages signing keys securely
4. **Testing**: Always test builds before submitting to production
5. **Backup**: Keep backups of your signing keys (EAS stores them securely)

## Useful Commands

```bash
# Check build status
eas build:list

# Download build
eas build:download --id <BUILD_ID>

# View build logs
eas build:view <BUILD_ID>

# Manage credentials
eas credentials

# Submit to Play Store
eas submit --platform android

# Check project configuration
eas config

# Login/logout
eas login
eas logout
```

## Resources

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **Play Console**: https://play.google.com/console
- **Play Store Guidelines**: https://play.google.com/about/developer-content-policy/
- **EAS Dashboard**: https://expo.dev/accounts/kaushik2004/projects/eco-sudar

## Support

If you encounter issues:
1. Check EAS build logs
2. Review Play Console feedback
3. Consult Expo documentation
4. Visit Expo forums: https://forums.expo.dev/

---

**Current Status**: Build in progress. Check terminal or EAS dashboard for updates.