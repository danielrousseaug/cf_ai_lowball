import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8787;

app.use(cors());
app.use(express.json());

// In-memory storage
const tasks = new Map();
const bids = new Map();
const users = new Map();

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Initialize with some mock data
const initializeMockData = () => {
  // Create a mock task
  const mockTask = {
    id: 'task-1',
    title: 'Clean bathroom',
    description: 'Need someone to deep clean my bathroom. All supplies provided.',
    category: 'cleaning',
    tags: ['cleaning', 'quick', 'indoor'],
    creatorId: 'alice',
    creatorName: 'Alice',
    auctionType: 'standard',
    currentBid: { type: 'points', amount: 180 },
    startingBid: { type: 'points', amount: 250 },
    buyItNowPrice: null,
    dutchAuctionRate: null,
    status: 'active',
    startTime: Date.now() - 3600000, // 1 hour ago
    endTime: Date.now() + 7200000, // 2 hours from now
    verificationRequired: true,
    verificationMethod: 'photo',
    createdAt: Date.now() - 3600000
  };

  tasks.set('task-1', mockTask);

  // Add some bids
  bids.set('task-1', [
    {
      id: 'bid-1',
      taskId: 'task-1',
      userId: 'bob',
      userName: 'Bob',
      amount: { type: 'points', amount: 240 },
      timestamp: Date.now() - 3000000
    },
    {
      id: 'bid-2',
      taskId: 'task-1',
      userId: 'charlie',
      userName: 'Charlie',
      amount: { type: 'points', amount: 200 },
      timestamp: Date.now() - 1800000
    },
    {
      id: 'bid-3',
      taskId: 'task-1',
      userId: 'diana',
      userName: 'Diana',
      amount: { type: 'points', amount: 180 },
      timestamp: Date.now() - 600000
    }
  ]);
};

initializeMockData();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Mock Auction Backend API', version: '1.0.0' });
});

// Get active tasks
app.get('/tasks/active', (req, res) => {
  const activeTasks = Array.from(tasks.values())
    .filter(task => task.status === 'active' && task.endTime > Date.now());
  res.json(activeTasks);
});

// Get task by ID
app.get('/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// Get task bids
app.get('/tasks/:id/bids', (req, res) => {
  const taskBids = bids.get(req.params.id) || [];
  res.json(taskBids);
});

// Create task
app.post('/tasks', (req, res) => {
  const taskId = generateId();
  const newTask = {
    id: taskId,
    ...req.body,
    status: 'active',
    currentBid: req.body.startingBid,
    createdAt: Date.now(),
    startTime: Date.now()
  };

  tasks.set(taskId, newTask);
  bids.set(taskId, []);

  res.json(newTask);
});

// Place bid
app.post('/bids', (req, res) => {
  const { taskId, userId, userName, amount } = req.body;
  const task = tasks.get(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Validate bid is lower than current
  if (amount.amount >= task.currentBid.amount) {
    return res.status(400).json({ error: 'Bid must be lower than current bid' });
  }

  const bidId = generateId();
  const newBid = {
    id: bidId,
    taskId,
    userId,
    userName,
    amount,
    timestamp: Date.now()
  };

  // Update task with new current bid
  task.currentBid = amount;
  tasks.set(taskId, task);

  // Add bid to history
  const taskBids = bids.get(taskId) || [];
  taskBids.push(newBid);
  bids.set(taskId, taskBids);

  res.json(newBid);
});

// Get predicted bid range
app.get('/tasks/:id/predicted-range', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const currentAmount = task.currentBid.amount;
  res.json({
    min: Math.max(0, currentAmount - 50),
    max: currentAmount - 10,
    predicted: currentAmount - 30
  });
});

// Buy it now
app.post('/tasks/:id/buy-now', (req, res) => {
  const { userId, userName } = req.body;
  const task = tasks.get(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!task.buyItNowPrice) {
    return res.status(400).json({ error: 'Buy it now not available' });
  }

  // Mark task as completed
  task.status = 'completed';
  task.winnerId = userId;
  task.winnerName = userName;
  task.finalPrice = task.buyItNowPrice;
  tasks.set(req.params.id, task);

  res.json({ success: true, task });
});

// Get user tasks
app.get('/users/:userId/tasks', (req, res) => {
  const userTasks = Array.from(tasks.values())
    .filter(task => task.creatorId === req.params.userId);
  res.json(userTasks);
});

// Get user bids
app.get('/users/:userId/bids', (req, res) => {
  const userBids = [];
  bids.forEach((taskBids) => {
    const userTaskBids = taskBids.filter(bid => bid.userId === req.params.userId);
    userBids.push(...userTaskBids);
  });
  res.json(userBids);
});

// Get user stats
app.get('/users/:userId/stats', (req, res) => {
  res.json({
    totalTasksCompleted: 12,
    totalTasksCreated: 5,
    reliabilityScore: 95,
    qualityRating: 4.5,
    totalPointsEarned: 1250
  });
});

// Get leaderboard
app.get('/leaderboard', (req, res) => {
  const mockLeaderboard = [
    { rank: 1, userId: 'alice', userName: 'Alice', tasksCompleted: 45, pointsEarned: 3250, reliabilityScore: 98 },
    { rank: 2, userId: 'bob', userName: 'Bob', tasksCompleted: 38, pointsEarned: 2890, reliabilityScore: 95 },
    { rank: 3, userId: 'charlie', userName: 'Charlie', tasksCompleted: 35, pointsEarned: 2650, reliabilityScore: 97 }
  ];
  res.json(mockLeaderboard);
});

app.listen(PORT, () => {
  console.log(`🚀 Mock backend server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for frontend`);
  console.log(`📦 Initialized with mock data`);
});
