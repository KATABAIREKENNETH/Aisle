# Aisle - Wedding Planning App

A comprehensive wedding planning application built with React Native and Expo, designed to help couples plan their perfect wedding from engagement to the big day.

## Tech Stack

- **Framework**: React Native with Expo SDK 51
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Backend**: Supabase (auth, database, storage, realtime)
- **UI**: React Native Paper, Expo Vector Icons (Ionicons)
- **TypeScript**: Full type safety

## Quick Start

Get the app running in 5 minutes:

```bash
# Install dependencies
npm install

# Set up Supabase (see SETUP.md for detailed instructions)
cp .env.example .env
# Add your Supabase credentials to .env

# Start the development server
npm start
```

For detailed setup instructions, platform-specific guides, and troubleshooting, see [SETUP.md](SETUP.md).

## Project Structure

```
aisle/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── profile/           # Profile settings
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── dashboard/        # Dashboard components
│   ├── tasks/            # Task components
│   ├── budget/           # Budget components
│   ├── guests/           # Guest components
│   └── vendors/          # Vendor components
├── lib/                  # Core utilities
│   ├── supabase/         # Supabase client
│   ├── api/              # API functions
│   ├── hooks/            # Custom hooks
│   └── utils/            # Utility functions
├── store/                # Zustand stores
├── types/                # TypeScript types
├── config/               # Configuration files
└── assets/               # Images, fonts, icons
```

## Features

### Phase 1 MVP (Current)

- ✅ Onboarding & authentication
- ✅ Dashboard with countdown timer
- ✅ Task management
- ✅ Budget tracker
- ✅ Guest list & RSVP
- ✅ Vendor management
- ✅ Couple co-planning

### Phase 2 (Planned)

- Digital invitations
- Seating chart builder
- Wedding day timeline
- In-app messaging
- Mood board / inspiration
- Wedding website

### Phase 3 (Planned)

- Guest photo hub
- Registry manager
- Honeymoon planner
- Vendor portal & marketplace
- Planner Pro tier

## Database Schema

The app uses Supabase PostgreSQL with the following main tables:

- `profiles` - User profiles
- `weddings` - Wedding details
- `tasks` - Task management
- `budget_categories` - Budget categories
- `expenses` - Expense tracking
- `vendors` - Vendor management
- `guests` - Guest list
- `appointments` - Appointments
- `messages` - Messaging
- `activity_log` - Activity tracking

See `ARCHITECTURE.md` for detailed schema.

## Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `EXPO_PUBLIC_RESEND_API_KEY` - Resend API key for emails (optional)
- `EXPO_PUBLIC_TWILIO_ACCOUNT_SID` - Twilio account SID for SMS (optional)
- `EXPO_PUBLIC_TWILIO_AUTH_TOKEN` - Twilio auth token for SMS (optional)

## Scripts

- `npm start` - Start development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm test` - Run tests

## License

MIT
