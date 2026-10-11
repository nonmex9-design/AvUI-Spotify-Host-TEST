export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const role = url.searchParams.get('role');
    
    if (!code || !role) {
      return new Response('Missing code or role', { status: 400 });
    }

    const id = env.ROOMS.idFromName(code);
    const room = env.ROOMS.get(id);
    return room.fetch(request);
  }
};

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ role });
    
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    const { role } = ws.deserializeAttachment();
    const otherRole = role === 'game' ? 'browser' : 'game';
    
    for (const [id, socket] of this.state.getWebSockets()) {
      const att = socket.deserializeAttachment();
      if (att.role === otherRole) {
        socket.send(message);
      }
    }
  }

  async webSocketClose(ws) {
    ws.close();
  }
}