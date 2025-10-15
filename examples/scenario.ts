/**
 * Example scenario demonstrating the Lowball reverse auction flow
 */

// Example 1: Creating a simple task
const createTaskExample = {
  title: "Clean bathroom",
  description: "Deep clean needed. All supplies will be provided.",
  creatorId: "alice-123",
  startingPayment: {
    type: "points",
    amount: 250
  },
  duration: 24 * 60 * 60 * 1000, // 24 hours
  auctionType: "standard",
  verificationRequired: true,
  verificationMethod: "photo",
  category: "cleaning",
  tags: ["indoor", "quick", "residential"]
};

// Example 2: Placing a bid (reverse auction - bidding DOWN)
const placeBidExample = {
  taskId: "task-abc-123",
  userId: "bob-456",
  amount: {
    type: "points",
    amount: 200 // Lower than starting price of 250!
  }
};

// Example 3: Creating a Buy It Now task
const buyItNowTaskExample = {
  title: "Walk my dog",
  description: "30 minute walk around the neighborhood",
  creatorId: "carol-789",
  startingPayment: {
    type: "points",
    amount: 150
  },
  buyItNowPrice: {
    type: "points",
    amount: 100 // Fixed price for instant claim
  },
  duration: 12 * 60 * 60 * 1000, // 12 hours
  auctionType: "buyItNow",
  category: "pets"
};

// Example 4: Multi-currency task
const multiCurrencyExample = {
  title: "Help me move furniture",
  description: "Need help moving a couch to second floor",
  creatorId: "dave-321",
  startingPayment: {
    type: "timeBank", // Paying with time credits
    amount: 120 // 2 hours of time
  },
  duration: 48 * 60 * 60 * 1000, // 48 hours
  auctionType: "standard",
  category: "moving"
};

// Example 5: Completing a task
const completeTaskExample = {
  taskId: "task-xyz-789",
  completerId: "bob-456",
  proof: "https://example.com/bathroom-clean-photo.jpg",
  qualityRating: 5,
  feedback: "Great job! Bathroom looks spotless."
};

export {
  createTaskExample,
  placeBidExample,
  buyItNowTaskExample,
  multiCurrencyExample,
  completeTaskExample
};
