import { Agent } from 'agents';
import { createWorkersAI } from 'workers-ai-provider';
import { streamText, tool } from 'ai';
import { z } from 'zod';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatSession {
  userId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/**
 * ChatAgent - AI-powered chat assistant for the Lowball platform
 *
 * Uses Llama 3.3 70B via Workers AI to provide intelligent assistance
 * for users navigating the reverse auction system.
 */
export class ChatAgent extends Agent {
  private async ensureInitialized() {
    // Create messages table for conversation history if not exists
    await this.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `;

    // Create index for faster queries
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_user_messages ON messages(user_id, timestamp)
    `;
  }

  /**
   * Handle incoming chat message
   */
  async chat(params: {
    userId: string;
    message: string;
  }): Promise<{ response: string; messageId: string }> {
    await this.ensureInitialized();

    // Save user message
    const userMessageId = this.generateId();
    const userTimestamp = Date.now();

    await this.sql`
      INSERT INTO messages (id, user_id, role, content, timestamp)
      VALUES (${userMessageId}, ${params.userId}, 'user', ${params.message}, ${userTimestamp})
    `;

    // Get conversation history
    const history = await this.getMessageHistory(params.userId);

    // Get environment bindings
    const ai = (this.env as any).AI;
    const auctionAgentNamespace = (this.env as any).AUCTION_AGENT;
    const auctionAgentId = auctionAgentNamespace.idFromName('main');
    const auctionAgent = auctionAgentNamespace.get(auctionAgentId);

    // Create Workers AI provider
    const workersai = createWorkersAI({ binding: ai });

    // Define tools the AI can use (disabled for now due to type issues)
    /*
    const tools = {
      getBidRecommendation: tool({
        description: 'Get a bid recommendation for a specific task based on historical data',
        parameters: z.object({
          taskId: z.string().describe('The ID of the task'),
        }),
        execute: async ({ taskId }: { taskId: string }) => {
          try {
            const task = await auctionAgent.getTask(taskId);
            if (!task) return { error: 'Task not found' };

            const bids = await auctionAgent.getTaskBids(taskId);
            const prediction = await auctionAgent.getPredictedBidRange(taskId);

            return {
              currentBid: task.currentBid,
              numberOfBids: bids.length,
              prediction,
              recommendation: prediction
                ? `Based on similar tasks, bids typically range from ${prediction.min} to ${prediction.max} ${task.currentBid.type}, with an average of ${prediction.average}. To be competitive, consider bidding around ${Math.floor(prediction.average * 0.95)} ${task.currentBid.type}.`
                : `This task currently has a bid of ${task.currentBid.amount} ${task.currentBid.type}. To win, you need to bid lower than this amount.`
            };
          } catch (error) {
            return { error: 'Failed to get bid recommendation' };
          }
        },
      }),

      getUserStats: tool({
        description: 'Get statistics for a user including tasks completed, win rate, and performance',
        parameters: z.object({
          userId: z.string().describe('The user ID'),
        }),
        execute: async ({ userId }: { userId: string }) => {
          try {
            const profile = await auctionAgent.getUserProfile(userId);
            const balance = await auctionAgent.getUserBalance(userId);
            const tasks = await auctionAgent.getUserTasks(userId);

            return {
              profile,
              balance,
              tasksCreated: tasks.created.length,
              tasksWon: tasks.won.length,
              activeBids: tasks.bidding.length,
            };
          } catch (error) {
            return { error: 'Failed to get user stats' };
          }
        },
      }),

      searchTasks: tool({
        description: 'Search for active tasks, optionally filtered by category',
        parameters: z.object({
          category: z.string().optional().describe('Optional category filter'),
        }),
        execute: async ({ category }: { category?: string }) => {
          try {
            const tasks = await auctionAgent.getActiveTasks();
            const filtered = category
              ? tasks.filter((t: any) => t.category === category)
              : tasks;

            return {
              totalTasks: filtered.length,
              tasks: filtered.slice(0, 5).map((t: any) => ({
                id: t.id,
                title: t.title,
                category: t.category,
                currentBid: t.currentBid,
                timeRemaining: t.endTime - Date.now(),
              })),
            };
          } catch (error) {
            return { error: 'Failed to search tasks' };
          }
        },
      }),
    };
    */

    // Build messages array for AI
    const messages = [
      {
        role: 'system' as const,
        content: `You are an AI assistant for Lowball, a reverse auction platform where people post tasks and others bid DOWN to do them - the lowest bidder wins.

Key Platform Concepts:
- Tasks are posted with a starting payment amount
- Users bid LOWER amounts to compete (e.g., 200 → 150 → 120 points)
- The person willing to do the task for the least money/points wins
- Users don't need balance to bid - they're offering to DO work
- Bidders get paid by the task creator when they complete the work
- Multiple currency types: cash ($), points, favor tokens, time bank (minutes)

Your role:
- Help users understand how reverse auctions work
- Provide bid recommendations based on market data
- Answer questions about their tasks, bids, and performance
- Offer strategic advice for winning bids or creating effective tasks
- Be friendly, concise, and helpful

Current user: ${params.userId}`,
      },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Stream AI response
    const result = await streamText({
      model: workersai('@cf/meta/llama-3.1-70b-instruct' as any),
      messages,
      temperature: 0.7,
    });

    // Collect the full response
    let fullResponse = '';
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    // Save assistant message
    const assistantMessageId = this.generateId();
    await this.sql`
      INSERT INTO messages (id, user_id, role, content, timestamp)
      VALUES (${assistantMessageId}, ${params.userId}, 'assistant', ${fullResponse}, ${Date.now()})
    `;

    return {
      response: fullResponse,
      messageId: assistantMessageId,
    };
  }

  /**
   * Get message history for a user
   */
  private async getMessageHistory(userId: string, limit: number = 10): Promise<ChatMessage[]> {
    const rows = await this.sql`
      SELECT * FROM messages
      WHERE user_id = ${userId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return rows.reverse().map(row => ({
      id: row.id as string,
      role: row.role as 'user' | 'assistant',
      content: row.content as string,
      timestamp: row.timestamp as number,
    }));
  }

  /**
   * Get conversation history (all messages)
   */
  async getHistory(userId: string): Promise<ChatMessage[]> {
    await this.ensureInitialized();
    return this.getMessageHistory(userId, 50);
  }

  /**
   * Clear conversation history for a user
   */
  async clearHistory(userId: string): Promise<void> {
    await this.ensureInitialized();
    await this.sql`
      DELETE FROM messages WHERE user_id = ${userId}
    `;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
