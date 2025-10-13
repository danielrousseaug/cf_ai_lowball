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
