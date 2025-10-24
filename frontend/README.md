# Lowball Frontend

Clean, minimal frontend for the Lowball reverse auction platform.

## Features

- **Task Listing** - Browse all active tasks
- **Task Detail** - View task details and bid history
- **Place Bids** - Bid on tasks (lower bids win)
- **Create Tasks** - Post new tasks for others to bid on
- **Dashboard** - Track your tasks, bids, and winnings
- **Leaderboard** - See top performers
- **Balance Tracking** - Monitor cash, points, favors, and time bank

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
npm run build
```

## Deploy to Vercel

```bash
npx vercel
```

Or use the Vercel dashboard and import this directory.

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Your Cloudflare Workers API endpoint (already set to production)

## Design Philosophy

- Minimal & clean monochromatic design
- Light theme with strategic color use
- Typography-first approach
- Functional and accessible
