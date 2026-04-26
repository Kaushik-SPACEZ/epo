# Account Switch Guide - Eco Sudar

## Current Status
✅ Logged out from old account (kaushik2004)
⏳ Need to login with new account

## New Account Details
- **Username**: kaushik_2004
- **Email**: kaushikwork2004@gmail.com

## Steps to Login

### Option 1: Login via Terminal (Recommended)
Open a new terminal and run:

```bash
eas login
```

When prompted:
1. Enter username or email: `kaushik_2004` or `kaushikwork2004@gmail.com`
2. Enter your password
3. Press Enter

### Option 2: Login via Browser
```bash
eas login --web
```

This will open a browser window where you can login with your credentials.

## After Login - Verify Account

Run this command to verify you're logged in with the correct account:

```bash
eas whoami
```

You should see:
```
kaushik_2004
kaushikwork2004@gmail.com
```

## Update Project Configuration

After logging in, you may need to update the project ID. Run:

```bash
eas project:info
```

If the project is not linked to your new account, you'll need to either:

### Option A: Link to Existing Project (if you have one)
```bash
eas project:link
```

### Option B: Create New Project
The project will be automatically created when you run the first build.

## Run the Build

Once logged in and verified, run:

```bash
eas build --platform android --profile production
```

## Important Notes

### About Build Quotas
- **New Account**: Your new account (kaushik_2004) will have its own build quota
- **Free Plan**: Includes limited builds per month
- **Check Quota**: Visit https://expo.dev/accounts/kaushik_2004/settings/billing

### About Project ID
The current project ID in app.json is:
```json
"projectId": "92bf278f-4f03-4998-b450-1dee4c316a5b"
```

This belongs to the old account. When you build with the new account:
1. EAS will detect the mismatch
2. It will prompt you to create a new project or link to an existing one
3. The new project ID will be automatically updated in app.json

### About Signing Keys
- If you had signing keys with the old account, you'll need to set them up again
- EAS can generate new keys automatically
- Or you can upload existing keys if you have them

## Complete Workflow

1. **Login** (you need to do this manually in terminal):
   ```bash
   eas login
   ```

2. **Verify Login**:
   ```bash
   eas whoami
   ```

3. **Check Project Status**:
   ```bash
   eas project:info
   ```

4. **Run Build**:
   ```bash
   eas build --platform android --profile production
   ```

5. **Follow Prompts**:
   - If asked to create a new project, say Yes
   - If asked about signing keys, let EAS generate them
   - If asked about credentials, follow the prompts

## Troubleshooting

### If Login Fails
- Make sure you're using the correct username: `kaushik_2004`
- Make sure you're using the correct email: `kaushikwork2004@gmail.com`
- Try the web login option: `eas login --web`

### If Project Link Fails
- Run: `eas project:init`
- This will create a new project and update app.json

### If Build Fails Due to Quota
- Check your new account's build quota
- Visit: https://expo.dev/accounts/kaushik_2004/settings/billing
- Consider upgrading if needed

## Next Steps After Successful Login

1. ✅ Verify account with `eas whoami`
2. ✅ Check project status with `eas project:info`
3. ✅ Run build command
4. ✅ Follow any prompts for project setup
5. ✅ Wait for build to complete (10-20 minutes)
6. ✅ Download AAB file
7. ✅ Submit to Play Store

## Quick Reference

```bash
# Login
eas login

# Verify
eas whoami

# Project info
eas project:info

# Build
eas build --platform android --profile production

# Check builds
eas build:list

# Download build
eas build:download --id <BUILD_ID>
```

---

**Action Required**: Please open a terminal and run `eas login` to login with your new account credentials.