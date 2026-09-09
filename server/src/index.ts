import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { registerSocketHandlers } from './socket/handlers';
import { getRoomByCode, roomToPublic } from './rooms';

dotenv.config();

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const httpServer = createServer(app);

// CORS config
const corsOptions = {
  origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO server
const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// REST endpoints for quick lookups
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/room/:code', (req, res) => {
  const room = getRoomByCode(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  // Only return public info (no host token)
  res.json(roomToPublic(room));
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║          TYPINGARENA SERVER               ║
║      Real-time Multiplayer Typing         ║
╚═══════════════════════════════════════════╝
  Server running on http://localhost:${PORT}
  Client origin: ${CLIENT_URL}
  `);
});

export default app;
