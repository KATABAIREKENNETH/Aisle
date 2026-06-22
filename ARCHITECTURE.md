# Aisle Wedding Planning App - Technical Architecture

## Project Overview
**Aisle** is a React Native wedding planning app built with Expo, designed to help couples plan their weddings from engagement to the big day.

## Tech Stack

### Mobile Framework
- **React Native** with **Expo SDK** (latest stable version)
- **Expo Router** for file-based navigation
- **TypeScript** for type safety

### Navigation
- **Expo Router** (file-based routing)
- Stack navigation for nested screens
- Tab navigation for main app sections

### State Management
- **Zustand** for global state
- **React Context** for theme and auth
- **TanStack Query** (React Query) for server state management

### Backend
- **Supabase** (BaaS)
  - Authentication (email, Google, Apple sign-in)
  - PostgreSQL database
  - Real-time subscriptions
  - File storage (photos, contracts, receipts)
  - Edge functions (if needed)

### Push Notifications
- **Expo Notifications** (via Expo Application Services)
- **Supabase Realtime** for in-app notifications

### UI Components & Styling
- **React Native Paper** or **NativeBase** for component library
- **React Native Reanimated** for animations
- **React Native Gesture Handler** for gestures
- **Expo Vector Icons** (Ionicons)
- **React Native Chart Kit** for budget visualizations
- **React Native Calendars** for calendar views

### Additional Services
- **Resend** or **SendGrid** for email sending
- **Twilio** for SMS
- **Google Maps SDK** for vendor map view
- **Expo Calendar API** for calendar sync
- **Expo Image Picker** for photo uploads
- **Expo Document Picker** for file uploads (contracts, receipts)
- **Expo SecureStore** for secure token storage

### Development Tools
- **ESLint** for linting
- **Prettier** for code formatting
- **Husky** for git hooks
- **Jest** + **React Native Testing Library** for testing
- **Flipper** for debugging

## Project Structure

```
aisle/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout
│   ├── (auth)/                  # Auth group
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/                  # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # Dashboard
│   │   ├── tasks.tsx            # Task management
│   │   ├── budget.tsx           # Budget tracker
│   │   ├── guests.tsx           # Guest list
│   │   └── vendors.tsx          # Vendor management
│   ├── profile/                 # Profile settings
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   └── modal.tsx                # Global modal
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── ...
│   ├── dashboard/               # Dashboard components
│   │   ├── CountdownTimer.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── TaskPreview.tsx
│   │   └── ...
│   ├── tasks/                   # Task components
│   │   ├── TaskCard.tsx
│   │   ├── TaskForm.tsx
│   │   └── ...
│   ├── budget/                  # Budget components
│   │   ├── BudgetChart.tsx
│   │   ├── ExpenseForm.tsx
│   │   └── ...
│   ├── guests/                  # Guest components
│   │   ├── GuestCard.tsx
│   │   ├── GuestForm.tsx
│   │   └── ...
│   └── vendors/                 # Vendor components
│       ├── VendorCard.tsx
│       ├── VendorForm.tsx
│       └── ...
├── lib/                         # Core utilities
│   ├── supabase/                # Supabase client
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── types.ts
│   ├── api/                     # API functions
│   │   ├── tasks.ts
│   │   ├── budget.ts
│   │   ├── guests.ts
│   │   └── vendors.ts
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useTasks.ts
│   │   └── ...
│   ├── utils/                   # Utility functions
│   │   ├── date.ts
│   │   ├── currency.ts
│   │   └── validation.ts
│   └── constants.ts             # App constants
├── store/                       # Zustand stores
│   ├── authStore.ts
│   ├── weddingStore.ts
│   ├── taskStore.ts
│   └── ...
├── types/                       # TypeScript types
│   ├── index.ts
│   ├── wedding.ts
│   ├── task.ts
│   ├── budget.ts
│   ├── guest.ts
│   └── vendor.ts
├── config/                      # Configuration files
│   ├── supabase.ts
│   └── theme.ts
├── assets/                      # Images, fonts, etc.
│   ├── images/
│   ├── fonts/
│   └── icons/
├── .env.local                   # Environment variables
├── app.json                     # Expo config
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema (Supabase)

### Core Tables

```sql
-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'couple', -- couple, planner, vendor, guest
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weddings
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES profiles(id),
  partner_id UUID REFERENCES profiles(id),
  wedding_date DATE NOT NULL,
  wedding_location TEXT,
  venue_name TEXT,
  budget DECIMAL(10,2),
  guest_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- venue, catering, attire, etc.
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  assigned_to UUID REFERENCES profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Categories
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  name TEXT NOT NULL,
  budget_amount DECIMAL(10,2),
  spent_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  category_id UUID REFERENCES budget_categories(id),
  vendor_id UUID REFERENCES vendors(id),
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- photographer, caterer, florist, etc.
  email TEXT,
  phone TEXT,
  website TEXT,
  status TEXT DEFAULT 'researching', -- researching, contacted, quoted, booked, paid
  quoted_amount DECIMAL(10,2),
  actual_amount DECIMAL(10,2),
  contract_url TEXT,
  rating INTEGER,
  review TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guests
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  dietary_needs TEXT,
  plus_one BOOLEAN DEFAULT false,
  plus_one_name TEXT,
  group_tag TEXT, -- family, friends, coworkers, etc.
  rsvp_status TEXT DEFAULT 'invited', -- invited, opened, attending, declined, no_response
  meal_preference TEXT,
  accommodation_needed BOOLEAN DEFAULT false,
  accessibility_needs TEXT,
  children_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  vendor_id UUID REFERENCES vendors(id),
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  sender_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id), -- null for broadcast
  vendor_id UUID REFERENCES vendors(id), -- if vendor message
  subject TEXT,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT, -- task, budget, guest, vendor
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Authentication Flow

1. **Sign Up**
   - User creates account via email/password or OAuth (Google, Apple)
   - Profile created in `profiles` table
   - User redirected to onboarding

2. **Onboarding**
   - Set wedding date & location
   - Add partner (send invite)
   - Set budget
   - Select wedding size
   - Wedding record created in `weddings` table
   - Pre-built tasks generated based on timeline

3. **Sign In**
   - User authenticates via Supabase Auth
   - Session stored in SecureStore
   - User redirected to dashboard

## State Management Strategy

### Global State (Zustand)
- `authStore`: User session, profile data
- `weddingStore`: Wedding details, partner info
- `taskStore`: Tasks, filters, sorting
- `budgetStore`: Budget categories, expenses
- `guestStore`: Guest list, RSVP status
- `vendorStore`: Vendors, filters

### Server State (TanStack Query)
- API calls to Supabase
- Automatic caching and refetching
- Optimistic updates for better UX

## Navigation Structure

### Auth Flow
- Login → Register → Onboarding → Dashboard

### Main App (Tabs)
- Dashboard (Home)
- Tasks
- Budget
- Guests
- Vendors

### Stack Navigation
- Each tab can navigate to detail screens
- Modal screens for forms

## API Layer

All Supabase queries wrapped in `lib/api/` functions:

```typescript
// Example: lib/api/tasks.ts
export async function getTasks(weddingId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('due_date', { ascending: true });
  
  if (error) throw error;
  return data;
}
```

## Real-time Features

- **Task updates**: Subscribe to task changes for couple sync
- **Vendor messages**: Real-time chat with vendors
- **RSVP updates**: Live guest list updates
- **Activity feed**: Real-time activity log

## Performance Optimizations

- **FlatList** for long lists (tasks, guests, vendors)
- **Memoization** for expensive components
- **Image caching** for photos
- **Lazy loading** for non-critical screens
- **Code splitting** with Expo Router

## Security Considerations

- Row Level Security (RLS) on all Supabase tables
- Secure token storage with Expo SecureStore
- Input validation on all forms
- HTTPS for all API calls
- Rate limiting on API endpoints

## Testing Strategy

- Unit tests for utility functions
- Component tests for UI components
- Integration tests for API calls
- E2E tests with Detox (optional)

## Deployment

- **Development**: Expo Go app
- **Staging**: EAS Build (TestFlight)
- **Production**: EAS Build (App Store, Google Play)

## Phase 1 MVP Implementation Order

1. Project setup & architecture
2. Supabase backend setup
3. Authentication flow
4. Dashboard with countdown
5. Task management
6. Budget tracker
7. Guest list
8. Vendor management
9. Couple collaboration features

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_RESEND_API_KEY=your_resend_key
EXPO_PUBLIC_TWILIO_ACCOUNT_SID=your_twilio_sid
EXPO_PUBLIC_TWILIO_AUTH_TOKEN=your_twilio_token
```

## Next Steps

1. Initialize Expo project
2. Set up Supabase project and database
3. Configure environment variables
4. Build authentication flow
5. Implement dashboard
6. Build remaining Phase 1 features
