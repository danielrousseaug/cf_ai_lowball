# How Lowball Works

A comprehensive guide to understanding the Lowball codebase.

**Bid low, win tasks** - the marketplace where lowest bidder wins.

---

## Quick Start

```bash
# Backend (from root)
npm install
npm run dev         # Runs on http://localhost:8787

# Frontend (from frontend/)
cd frontend
npm install
cp .env.example .env.local
npm run dev         # Runs on http://localhost:3000
```

---

## What is Lowball?

A reverse auction platform where users bid **down** for undesirable tasks. Instead of prices going up, they go down - the person willing to do it for the least compensation wins.

**Example Flow:**
1. Alice posts: "Clean the bathroom"
2. Bob bids: 200 points
3. Carol bids: 150 points (lower!)
4. Dave bids: 120 points (lowest!)
5. Dave wins and completes the task for 120 points

---

## Tech Stack

### Backend
- **Cloudflare Workers** - Serverless edge compute
- **Durable Objects** - Persistent state management
- **TypeScript** - Type safety

### Frontend
- **Next.js 14** - React framework with App Router
- **TanStack Query** - Data fetching and caching
- **Zustand** - Client state management
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

---

## Architecture

```
User Browser (Next.js)
    ↓
Cloudflare Workers (API)
    ↓
Durable Objects (Storage)
```

### Durable Objects

Three main types:

**1. Global Coordinator**
- Manages all active tasks
- Handles scheduled operations (auction endings)
- Coordinates state transitions

**2. User State**
- One per user
- Stores profile, balances, achievements
- Maintains transaction history

**3. Task State**
- One per task
- Stores task details and bids
- Enforces bid validation

---

## Frontend Structure

```
frontend/src/
├── app/                    # Next.js pages
│   ├── page.tsx           # Landing page
│   └── dashboard/         # Dashboard routes
│       ├── page.tsx       # Main dashboard
│       ├── create/        # Create task
│       ├── profile/       # User profile
│       ├── leaderboard/   # Rankings
│       └── my-tasks/      # User's tasks
│
├── components/
│   ├── ui/               # Base components (Button, Card, etc.)
│   ├── layout/           # DashboardNav
│   ├── providers/        # ThemeProvider
│   └── error-boundary.tsx
│
├── hooks/                # Custom React hooks
│   ├── use-tasks.ts     # Task queries/mutations
│   └── use-users.ts     # User queries/mutations
│
├── lib/
│   ├── api.ts           # API client
│   └── utils.ts         # Helper functions
│
├── stores/
│   └── user-store.ts    # Zustand store
│
└── types/
    └── index.ts         # TypeScript types
```

---

## Key Concepts

### 1. Reverse Auction Logic

In `bid-manager.ts`:
```typescript
// Bids must be LOWER than current lowest
function isValidBid(taskId: string, amount: number): boolean {
  const currentLowestBid = getCurrentLowestBid(taskId);
  return amount < currentLowestBid;
}
```

### 2. Multi-Currency System

Four currency types:
- **Cash** - Real money ($)
- **Points** - Internal platform currency
- **Favor Tokens** - "I owe you one" system
- **Time Bank** - Time commitments (minutes)

### 3. Last-Minute Bidding Protection

Auctions extend by 5 minutes if a bid comes in during the final minute (prevents sniping).

### 4. Auction Types

- **Standard** - Manual bidding, lowest wins
- **Dutch** - Price automatically decreases over time
- **Buy It Now** - Instant task claiming at premium price

---

## Data Flow

### Creating a Task

```
1. User fills form → CreateTaskPage
2. Form validates → react-hook-form + zod
3. Submit → useCreateTask() mutation
4. POST /api/tasks → Cloudflare Worker
5. Worker validates → Task created in Durable Object
6. Response → TanStack Query updates cache
7. Redirect to dashboard → New task appears
```

### Placing a Bid

```
1. User enters bid amount → BidForm
2. Client validates bid < current lowest
3. Submit → usePlaceBid() mutation
4. POST /api/bids → Cloudflare Worker
5. Worker validates:
   - User has balance
   - Bid is lower than current
   - Task is still active
6. If valid → Record bid in Durable Object
7. Check if last-minute bid → Extend auction if needed
8. Response → TanStack Query invalidates queries
9. UI updates → New bid shown
```

### Real-Time Updates

```
Component mounts
↓
useQuery hook initialized
↓
Fetch initial data
↓
Set refetch interval (3s-30s)
↓
Background refetch loop
↓
On new data → Automatic UI update
```

---

## State Management

### Server State (TanStack Query)

**Query Keys:**
```typescript
['tasks']                      // All tasks
['tasks', 'active']           // Active tasks
['tasks', taskId]             // Single task
['tasks', taskId, 'bids']     // Task bids
['users', userId]             // User profile
['users', userId, 'balance']  // User balance
['users', userId, 'tasks']    // User's tasks
['leaderboard', limit]        // Leaderboard
```

**Refetch Intervals:**
- Task bids: 3s (most critical)
- Single task: 5s
- Active tasks: 10s
- User balance: 10s
- Leaderboard: 30s
- User profile: 30s (staleTime)

### Client State (Zustand)

```typescript
// User authentication state
interface UserStore {
  user: User | null;
  balance: Balance | null;
  setUser: (user: User) => void;
  logout: () => void;
}
```

Stored in localStorage for persistence.

### Theme State (Context)

```typescript
type Theme = 'light' | 'dark' | 'system';

// Three modes:
// - light: Always light
// - dark: Always dark
// - system: Follow OS preference
```

Persisted to localStorage, synced across tabs.

---

## API Endpoints

### Tasks
```
POST   /api/tasks              # Create task
GET    /api/tasks              # List active tasks
GET    /api/tasks/:id          # Get task details
GET    /api/tasks/:id/bids     # Get task bids
POST   /api/bids               # Place bid
POST   /api/tasks/buy-now      # Accept Buy It Now
POST   /api/tasks/complete     # Mark complete
```

### Users
```
POST   /api/users              # Create user
GET    /api/users/:id          # Get profile
GET    /api/users/:id/balance  # Get balance
GET    /api/users/:id/tasks    # Get user's tasks
```

### Other
```
GET    /api/leaderboard        # Get rankings
```

---

## Key Files Explained

### Frontend

**`app/dashboard/page.tsx`**
- Main dashboard showing all active tasks
- Uses `useActiveTasks()` hook
- Auto-refreshes every 10 seconds
- Filters by category and search

**`app/dashboard/my-tasks/page.tsx`**
- Shows user's created/won/bidding tasks
- Three-tab interface
- Uses `useUserTasks()` hook

**`hooks/use-tasks.ts`**
- All task-related data fetching
- `useActiveTasks()` - Get all tasks
- `useTask(id)` - Get single task
- `useTaskBids(id)` - Get task bids
- `useCreateTask()` - Create task mutation
- `usePlaceBid()` - Place bid mutation

**`hooks/use-users.ts`**
- All user-related data fetching
- `useUserProfile(id)` - Get profile
- `useUserBalance(id)` - Get balance
- `useUserTasks(id)` - Get user's tasks
- `useLeaderboard(limit)` - Get rankings

**`components/providers/theme-provider.tsx`**
- Manages light/dark/system themes
- localStorage persistence
- System preference detection

**`components/error-boundary.tsx`**
- Catches React errors
- Shows user-friendly error UI
- Provides retry options

**`lib/utils.ts`**
- Helper functions:
  - `formatCurrency()` - Format money/points
  - `formatTimeRemaining()` - Format countdown
  - `getUrgencyColor()` - Color based on time left
  - `generateAvatarColor()` - Consistent user colors
  - `getInitials()` - Name → initials

### Backend

**`src/index.ts`**
- Main Worker entry point
- Routes all API requests
- Handles CORS

**`src/coordinator.ts`**
- Global auction coordination
- Scheduled operations
- Task state management

**`src/task-processor.ts`**
- Task creation and updates
- Auction ending logic
- Winner determination

**`src/user-manager.ts`**
- User CRUD operations
- Balance management
- Achievement system

**`src/bid-manager.ts`**
- Bid validation
- Bid placement
- Last-minute bidding protection

**`src/currency-system.ts`**
- Multi-currency handling
- Balance transfers
- Currency conversion

---

## Environment Variables

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_APP_NAME=Lowball
```

**Backend** (`.env`):
```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

---

## Common Patterns

### Adding a New Page

1. Create page in `app/dashboard/your-page/page.tsx`
2. Add navigation link in `DashboardNav`
3. Create hook if needed in `hooks/`
4. Use existing UI components from `components/ui/`

### Adding a New API Endpoint

1. Add route in `src/index.ts`
2. Create handler function
3. Update Durable Object if needed
4. Add frontend hook in `hooks/`
5. Update TypeScript types

### Adding a New Query

```typescript
export function useYourData(id: string) {
  return useQuery({
    queryKey: ['your-data', id],
    queryFn: () => api.getYourData(id),
    refetchInterval: 10000, // Optional
    staleTime: 30000,       // Optional
  });
}
```

### Adding a New Mutation

```typescript
export function useYourMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.doSomething(data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['your-data'] });
    },
  });
}
```

---

## Debugging Tips

### Frontend Issues

**Check TanStack Query DevTools:**
```typescript
// In providers.tsx, add:
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Check Console for Errors:**
- Network errors → Check API URL in `.env.local`
- Type errors → Run `npm run type-check`
- Build errors → Clear `.next` and rebuild

### Backend Issues

**Check Cloudflare Dashboard:**
- Worker logs show errors
- Durable Object state can be inspected

**Test API Directly:**
```bash
curl http://localhost:8787/api/tasks
```

---

## Performance

### Frontend
- Next.js Image optimization for avatars
- Route-based code splitting
- TanStack Query caching
- Lazy loading for heavy components

### Backend
- Edge computing (low latency)
- Durable Objects (in-memory operations)
- Efficient query patterns

---

## Deployment

**Frontend (Vercel):**
```bash
cd frontend
vercel --prod
```

**Backend (Cloudflare):**
```bash
wrangler publish
```

---

## Useful Commands

```bash
# Frontend
npm run dev         # Start dev server
npm run build       # Build for production
npm run type-check  # Check TypeScript
npm run lint        # Lint code
npm run format      # Format code
npm run validate    # Run all checks

# Backend
npm run dev         # Start dev server
npm run deploy      # Deploy to Cloudflare
```

---

## Project Philosophy

1. **Type Safety** - TypeScript everywhere
2. **Real-Time** - Auto-refreshing data
3. **User Experience** - Fast, responsive, intuitive
4. **Code Quality** - Clean, documented, tested
5. **Serverless** - No server management

---

That's it! You now understand how Lowball works. 🎉

For questions or issues, check the code - it's well-commented and follows consistent patterns.
