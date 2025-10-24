# Lowball
![unnamed](https://github.com/user-attachments/assets/4cb5dfba-5716-46fc-91c1-b46701a0de41)

**Bid low, win tasks** - the marketplace where lowest bidder wins.

A reverse auction platform where users bid down for undesirable tasks. The person willing to do it for the least compensation wins.

---

## Quick Start

```bash
# Backend
npm install
npm run dev         # http://localhost:8787

# Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev         # http://localhost:3000
```

---

## What is it?

Instead of traditional auctions where prices go up, Lowball reverses the model:

1. Someone posts a task: "Clean the bathroom"
2. Users bid down: $20 → $18 → $15 → $12
3. Lowest bidder wins and completes the task

---

## Features

- **Reverse Auctions** - Bid down, not up
- **Multi-Currency** - Cash, points, favor tokens, time bank
- **Real-Time Updates** - Auto-refreshing bids and tasks
- **Dark Mode** - Light, dark, and system themes
- **Gamification** - Achievements, leaderboards, ratings
- **Mobile Friendly** - Responsive design

---

## Tech Stack

**Backend:** Cloudflare Workers + Durable Objects
**Frontend:** Next.js 14 + React + TanStack Query + Tailwind CSS

---

## API Examples

### Create a Task
```bash
POST /api/tasks
{
  "title": "Clean bathroom",
  "description": "Deep clean",
  "creatorId": "user-123",
  "startingPayment": { "type": "points", "amount": 200 },
  "duration": 86400000,
  "auctionType": "standard"
}
```

### Place a Bid
```bash
POST /api/bids
{
  "taskId": "task-456",
  "userId": "user-789",
  "amount": { "type": "points", "amount": 150 }
}
```

---

## Documentation

**📖 [HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Complete guide to understanding the codebase

Everything you need to know is in one place.

---

## License

MIT
