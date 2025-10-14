import { AuctionAgent } from './agent';
import { ChatAgent } from './chat-agent';

export { AuctionAgent, ChatAgent };

// API handlers for Cloudflare Workers
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Get or create Durable Object instance
    const id = env.AUCTION_AGENT.idFromName('main');
    const stub = env.AUCTION_AGENT.get(id);

    try {
      // Route requests
      if (url.pathname === '/api/tasks' && request.method === 'POST') {
        const body = await request.json();
        const result = await stub.createTask(body);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/tasks' && request.method === 'GET') {
        const result = await stub.getActiveTasks();
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/tasks\/[^/]+$/) && request.method === 'GET') {
        const taskId = url.pathname.split('/').pop()!;
        const result = await stub.getTask(taskId);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/bids' && request.method === 'POST') {
        const body = await request.json();
        const result = await stub.placeBid(body);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/tasks\/[^/]+\/bids$/) && request.method === 'GET') {
        const taskId = url.pathname.split('/')[3];
        const result = await stub.getTaskBids(taskId);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/tasks/buy-now' && request.method === 'POST') {
        const body = await request.json();
        const result = await stub.acceptBuyItNow(body);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/tasks/complete' && request.method === 'POST') {
        const body = await request.json();
        const result = await stub.completeTask(body);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/users' && request.method === 'POST') {
        const body = await request.json();
        const result = await stub.createUser(body);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/users\/[^/]+$/) && request.method === 'GET') {
        const userId = url.pathname.split('/').pop()!;
        const result = await stub.getUserProfile(userId);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/users\/[^/]+\/balance$/) && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        const result = await stub.getUserBalance(userId);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/balance/add' && request.method === 'POST') {
        const body = await request.json();
        const result = await stub.addBalance(body);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/users\/[^/]+\/tasks$/) && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        const result = await stub.getUserTasks(userId);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/users\/[^/]+\/recommendations$/) && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        const result = await stub.getRecommendedTasks(userId);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const result = await stub.getLeaderboard(limit);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/tasks\/[^/]+\/predictions$/) && request.method === 'GET') {
        const taskId = url.pathname.split('/')[3];
        const result = await stub.getPredictedBidRange(taskId);
        return jsonResponse(result, corsHeaders);
      }

      // Chat endpoints
      if (url.pathname === '/api/chat' && request.method === 'POST') {
        const body = await request.json();
        const { userId, message } = body;

        if (!userId || !message) {
          return jsonResponse({ error: 'Missing userId or message' }, corsHeaders, 400);
        }

        const chatId = env.CHAT_AGENT.idFromName(userId);
        const chatStub = env.CHAT_AGENT.get(chatId);

        const result = await chatStub.chat({ userId, message });

        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/chat\/[^/]+\/history$/) && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        const chatId = env.CHAT_AGENT.idFromName(userId);
        const chatStub = env.CHAT_AGENT.get(chatId);

        const result = await chatStub.getHistory(userId);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname.match(/^\/api\/chat\/[^/]+\/history$/) && request.method === 'DELETE') {
        const userId = url.pathname.split('/')[3];
        const chatId = env.CHAT_AGENT.idFromName(userId);
        const chatStub = env.CHAT_AGENT.get(chatId);

        await chatStub.clearHistory(userId);
        return jsonResponse({ success: true }, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        corsHeaders,
        500
      );
    }
  },
};

function jsonResponse(data: any, headers: Record<string, string>, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

// TypeScript environment interface
interface Env {
  AUCTION_AGENT: DurableObjectNamespace;
  CHAT_AGENT: DurableObjectNamespace;
  AI: Ai;
}
