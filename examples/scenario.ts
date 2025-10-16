/**
 * Example Scenario: Roommate House Task Management
 *
 * This demonstrates a typical flow in a shared living situation where
 * roommates use the Reverse Auction Coordinator to manage undesirable tasks.
 */

// Example API calls - use these with your deployed Cloudflare Worker

const API_BASE = 'https://your-worker.workers.dev';

// Step 1: Create Users (Roommates)
async function setupRoommates() {
  const roommates = [
    { id: 'alice', name: 'Alice', email: 'alice@house.com' },
    { id: 'bob', name: 'Bob', email: 'bob@house.com' },
    { id: 'charlie', name: 'Charlie', email: 'charlie@house.com' },
    { id: 'diana', name: 'Diana', email: 'diana@house.com' }
  ];

  for (const roommate of roommates) {
    await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roommate)
    });
  }

  console.log('✅ Roommates created');
}

// Step 2: Alice posts an undesirable task
async function alicePostsBathroomTask() {
  const task = {
    title: 'Clean the shared bathroom',
    description: 'Deep clean including toilet, sink, shower, and floor. Must be done before inspection on Friday.',
    creatorId: 'alice',
    startingPayment: {
      type: 'points',
      amount: 200
    },
    duration: 86400000, // 24 hours
    auctionType: 'standard',
    buyItNowPrice: {
      type: 'points',
      amount: 300
    },
    verificationRequired: true,
    verificationMethod: 'photo',
    category: 'cleaning',
    tags: ['bathroom', 'deep-clean', 'urgent']
  };

  const response = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });

  const createdTask = await response.json();
  console.log('✅ Alice posted bathroom cleaning task:', createdTask.id);
  return createdTask.id;
}

// Step 3: Bidding war begins
async function biddingWar(taskId: string) {
  // Bob bids 180 points
  await fetch(`${API_BASE}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId,
      userId: 'bob',
      amount: { type: 'points', amount: 180 }
    })
  });
  console.log('💰 Bob bids 180 points');

  // Charlie underbids at 150 points
  await fetch(`${API_BASE}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId,
      userId: 'charlie',
      amount: { type: 'points', amount: 150 }
    })
  });
  console.log('💰 Charlie underbids at 150 points (Bob gets outbid notification)');

  // Diana goes lower at 120 points
  await fetch(`${API_BASE}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId,
      userId: 'diana',
      amount: { type: 'points', amount: 120 }
    })
  });
  console.log('💰 Diana underbids at 120 points (Charlie gets outbid notification)');

  // Bob decides it's worth it at 100 points
  await fetch(`${API_BASE}/api/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId,
      userId: 'bob',
      amount: { type: 'points', amount: 100 }
    })
  });
  console.log('💰 Bob makes final bid at 100 points (Diana gets outbid notification)');
}

// Step 4: Wait for auction to end (in real scenario, this happens automatically)
// The agent checks auctions every minute and assigns winners

// Step 5: Bob completes the task
async function bobCompletesTask(taskId: string) {
  const completion = {
    taskId,
    completerId: 'bob',
    proof: 'https://example.com/bathroom-clean.jpg',
    qualityRating: 5,
    feedback: 'Sparkly clean! Great job Bob!'
  };

  await fetch(`${API_BASE}/api/tasks/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(completion)
  });

  console.log('✅ Bob completed the task and earned 100 points');
}

// Step 6: Check Bob's achievements
async function checkBobsProgress() {
  const profile = await fetch(`${API_BASE}/api/users/bob`);
  const profileData = await profile.json();

  console.log('👤 Bob\'s Profile:');
  console.log(`  - Tasks Completed: ${profileData.totalTasksCompleted}`);
  console.log(`  - Reliability Score: ${profileData.reliabilityScore}`);
  console.log(`  - Quality Rating: ${profileData.qualityRating}/5`);
  console.log(`  - Achievements: ${profileData.achievements.map((a: any) => a.name).join(', ')}`);

  const balance = await fetch(`${API_BASE}/api/users/bob/balance`);
  const balanceData = await balance.json();

  console.log('💰 Bob\'s Balance:');
  console.log(`  - Points: ${balanceData.points}`);
  console.log(`  - Cash: $${balanceData.cash}`);
  console.log(`  - Favor Tokens: ${balanceData.favorTokens}`);
  console.log(`  - Time Bank: ${balanceData.timeBank} minutes`);
}

// Step 7: Diana posts a Dutch auction for trash duty
async function dianaPostsDutchAuction() {
  const task = {
    title: 'Take out trash on Monday morning',
    description: 'Trash collection is at 6 AM, someone needs to wake up early',
    creatorId: 'diana',
    startingPayment: {
      type: 'favorTokens',
      amount: 2
    },
    duration: 43200000, // 12 hours
    auctionType: 'dutch',
    dutchDecreaseRate: 0.2, // Decreases by 0.2 favor tokens per hour
    category: 'chores',
    tags: ['trash', 'early-morning']
  };

  await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });

  console.log('✅ Diana posted a Dutch auction for trash duty (price decreases over time)');
}

// Step 8: Charlie uses Buy It Now for urgent task
async function charlieUsesBuyItNow() {
  // First, Charlie posts an urgent task with Buy It Now
  const urgentTask = {
    title: 'Wait for repair technician TODAY',
    description: 'Plumber coming between 1-5 PM, someone must be home',
    creatorId: 'charlie',
    startingPayment: {
      type: 'cash',
      amount: 30
    },
    duration: 10800000, // 3 hours
    auctionType: 'buyItNow',
    buyItNowPrice: {
      type: 'cash',
      amount: 50
    },
    category: 'errands',
    tags: ['urgent', 'repair']
  };

  const response = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(urgentTask)
  });

  const task = await response.json();

  // Alice sees it and immediately uses Buy It Now
  await fetch(`${API_BASE}/api/tasks/buy-now`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId: task.id,
      userId: 'alice'
    })
  });

  console.log('⚡ Alice used Buy It Now for $50 to help Charlie');
}

// Step 9: View leaderboard
async function viewLeaderboard() {
  const response = await fetch(`${API_BASE}/api/leaderboard?limit=10`);
  const leaderboard = await response.json();

  console.log('🏆 House Leaderboard:');
  leaderboard.forEach((entry: any) => {
    console.log(`  ${entry.rank}. ${entry.userName} - ${entry.tasksCompleted} tasks, ${entry.pointsEarned} points`);
  });
}

// Run the complete scenario
async function runScenario() {
  console.log('🏠 Starting Roommate House Scenario\n');

  await setupRoommates();
  console.log('');

  const taskId = await alicePostsBathroomTask();
  console.log('');

  await biddingWar(taskId);
  console.log('');

  console.log('⏰ Waiting for auction to end...');
  console.log('');

  // In production, the agent automatically finalizes
  // Here we simulate task completion
  await bobCompletesTask(taskId);
  console.log('');

  await checkBobsProgress();
  console.log('');

  await dianaPostsDutchAuction();
  console.log('');

  await charlieUsesBuyItNow();
  console.log('');

  await viewLeaderboard();
  console.log('');

  console.log('✨ Scenario complete!');
}

// Export for use
export { runScenario };
