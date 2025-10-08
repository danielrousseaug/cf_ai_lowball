import { AuctionAgent } from './agent';

export { AuctionAgent };

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
  AI: Ai;
}
