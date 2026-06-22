# Aisle - Quick Start Guide

This guide will help you get the Aisle wedding planning app running on your local machine in minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org))
- **npm** (comes with Node.js) or yarn package manager
- **Git** for cloning the repository
- **Supabase account** (free tier works - [Sign up](https://supabase.com))
- **Expo Go app** on your phone OR iOS Simulator/Android Emulator

## Quick Start (5 minutes)

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd Aisla

# Install dependencies
npm install
```

### 2. Set Up Supabase

**Create a Supabase Project:**
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Enter project name and password
4. Choose a region close to you
5. Wait 2-3 minutes for project to be ready

**Run the Database Schema:**
1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to create all tables

**Run Database Migrations (for conversation tables):**
1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase/migrations/001_add_conversations.sql`
3. Paste it into the SQL Editor
4. Click "Run" to create conversation tables with proper RLS policies
5. This migration uses IF NOT EXISTS, so it's safe to run multiple times

**Get Your Credentials:**
1. In Supabase dashboard, go to Settings → API
2. Copy your Project URL
3. Copy your anon/public key

**Configure Environment Variables:**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start the App

```bash
npm start
```

### 4. Run on Your Device

**Option A: Expo Go (Recommended for beginners)**
1. Download Expo Go from App Store or Google Play
2. Scan the QR code in your terminal
3. App loads automatically

**Option B: iOS Simulator (macOS only)**
- Press `i` in the terminal

**Option C: Android Emulator**
- Press `a` in the terminal

**Option D: Web Browser**
- Press `w` in the terminal

## Verification Steps

Once the app is running:

1. **Test Authentication**
   - Click "Get Started"
   - Create an account with email/password
   - Complete the onboarding flow

2. **Explore Features**
   - Check the dashboard countdown timer
   - Navigate through Tasks, Budget, Guests, Vendors tabs
   - Test adding sample data

3. **Verify Database Connection**
   - Check Supabase dashboard → Table Editor
   - Verify data appears in profiles/weddings tables

## Platform-Specific Setup

### macOS (iOS Development)

```bash
# Install Xcode from App Store (required for iOS Simulator)
# Install CocoaPods
sudo gem install cocoapods

# Install iOS dependencies
cd ios && pod install && cd ..

# Run on iOS Simulator
npm run ios
```

### Windows (Android Development)

```bash
# Install Android Studio
# Set up an Android Emulator in Android Studio
# Configure ANDROID_HOME environment variable

# Run on Android Emulator
npm run android
```

### Linux (Android Development)

```bash
# Install Android Studio
# Set up an Android Emulator
# Configure ANDROID_HOME environment variable

# Run on Android Emulator
npm run android
```

## Common Issues & Solutions

### "Supabase URL or Anon Key is missing"
- Ensure `.env` file exists in project root
- Verify environment variables are set correctly
- Restart development server after changes

### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start -c
```

### iOS build fails
```bash
# Update pods
cd ios && pod install && cd ..
# Clear Expo cache
npx expo start -c
```

### Android build fails
```bash
# Clean gradle
cd android && ./gradlew clean && cd ..
# Restart with cache cleared
npx expo start -c
```

### TypeScript errors in IDE
- Run `npm install` to ensure dependencies are installed
- Restart TypeScript server in your IDE (Cmd+Shift+P → "TypeScript: Restart TS Server")
- Check that all type files in `types/` are properly exported

## Development Workflow

### Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
npm run lint       # Run ESLint
npm test           # Run tests
```

### Code Quality

```bash
# Check for linting issues
npm run lint

# Format code (if Prettier is configured)
npx prettier --write "**/*.{ts,tsx}"
```

## Optional Services

### Email (Resend)
For sending invitations and reminders:
1. Sign up at [resend.com](https://resend.com)
2. Add to `.env`:
   ```
   EXPO_PUBLIC_RESEND_API_KEY=your_resend_key
   ```

### SMS (Twilio)
For sending SMS notifications:
1. Sign up at [twilio.com](https://twilio.com)
2. Add to `.env`:
   ```
   EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_sid
   EXPO_PUBLIC_TWILIO_AUTH_TOKEN=your_token
   EXPO_PUBLIC_TWILIO_PHONE_NUMBER=your_phone
   ```

## Project Structure Overview

```
Aisla/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication flow
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── lib/                   # Core utilities
│   ├── supabase/         # Database client
│   ├── api/              # API functions
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Helper functions
├── store/                 # Zustand state management
├── types/                 # TypeScript definitions
├── config/                # App configuration
└── supabase/             # Database schema
```

## Next Steps

After getting the app running:

1. **Explore the codebase** - Check `ARCHITECTURE.md` for technical details
2. **Customize the UI** - Modify styles in component files
3. **Add features** - Implement new screens in `app/` directory
4. **Connect real data** - API functions are ready in `lib/api/`
5. **Write tests** - Add tests in `__tests__/` directory

## Getting Help

If you encounter issues:

1. **Check logs**
   - Expo terminal output
   - Supabase dashboard logs
   - Browser console (for web)

2. **Verify setup**
   - Node.js version: `node --version` (should be 18+)
   - npm version: `npm --version`
   - Environment variables in `.env`

3. **Common fixes**
   - Clear cache: `npx expo start -c`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Restart IDE/TypeScript server

4. **Resources**
   - [Expo Documentation](https://docs.expo.dev)
   - [Supabase Documentation](https://supabase.com/docs)
   - [React Native Documentation](https://reactnative.dev)

## Deployment

When ready to deploy to production:

1. **Set up EAS Build**
   ```bash
   npm install -g eas-cli
   eas build:configure
   ```

2. **Build for iOS**
   ```bash
   eas build --platform ios
   ```

3. **Build for Android**
   ```bash
   eas build --platform android
   ```

4. **Submit to stores**
   - iOS: App Store Connect
   - Android: Google Play Console

See [Expo Deployment Guide](https://docs.expo.dev/build/introduction) for detailed instructions.
