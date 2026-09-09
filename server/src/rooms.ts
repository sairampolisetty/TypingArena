import { v4 as uuidv4 } from 'uuid';
import { Room, Player, Settings, GameStatus, PlayerPublic, RoomPublic } from './types';
import { getRandomText } from './texts';

// In-memory room store
const rooms = new Map<string, Room>();
const roomsByCode = new Map<string, string>(); // code -> room id
const socketToPlayer = new Map<string, { roomId: string; playerId: string }>(); // socketId -> {roomId, playerId}
const socketToHost = new Map<string, string>(); // socketId -> roomId

// Generate a unique room code like TYP-7K4P
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, I, 0, 1 to avoid confusion
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (roomsByCode.has(code));
  return code;
}

function generateHostToken(): string {
  return uuidv4().replace(/-/g, '').substring(0, 32);
}

export function playerToPublic(player: Player): PlayerPublic {
  return {
    id: player.id,
    nickname: player.nickname,
    status: player.status,
    progress: player.progress,
    wpm: player.wpm,
    accuracy: player.accuracy,
    correctChars: player.correctChars,
    incorrectChars: player.incorrectChars,
    finishedAt: player.finishedAt,
    rank: player.rank,
  };
}

export function roomToPublic(room: Room): RoomPublic {
  const players = Array.from(room.players.values()).map(playerToPublic);
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    status: room.status,
    settings: room.settings,
    players,
    currentText: room.currentText,
    createdAt: room.createdAt,
    startTime: room.startTime,
    endTime: room.endTime,
    pausedAt: room.pausedAt,
    remainingTime: room.remainingTime,
    countdownTarget: room.countdownTarget,
    playerCount: players.filter(p => p.status !== 'disconnected').length,
  };
}

// Create a new room
export function createRoom(
  settings: Settings,
  hostNickname: string,
  roomName: string,
  hostSocketId: string
): { room: Room; hostToken: string; hostPlayerId: string | null } {
  const id = uuidv4();
  const code = generateRoomCode();
  const hostToken = generateHostToken();
  const hostId = uuidv4();

  const text = settings.textMode === 'custom' && settings.customText
    ? settings.customText
    : getRandomText(settings.difficulty);

  const room: Room = {
    id,
    code,
    name: roomName || 'Friday Typing Battle',
    hostId,
    hostToken,
    hostSocketId,
    status: 'waiting',
    settings,
    players: new Map(),
    currentText: text,
    createdAt: Date.now(),
    startTime: null,
    endTime: null,
    pausedAt: null,
    remainingTime: null,
    countdownTarget: null,
    gameTimer: null,
    countdownTimer: null,
    disconnectTimers: new Map(),
    hostDisconnectTimer: null,
  };

  rooms.set(id, room);
  roomsByCode.set(code, id);
  socketToHost.set(hostSocketId, id);

  // If host is participating as a player, create their player entry
  let hostPlayerId: string | null = null;
  if (settings.hostPlays) {
    const playerId = uuidv4();
    const hostPlayer: Player = {
      id: playerId,
      nickname: hostNickname.trim(),
      socketId: hostSocketId,
      status: 'waiting',
      progress: 0,
      wpm: 0,
      accuracy: 100,
      correctChars: 0,
      incorrectChars: 0,
      finishedAt: null,
      rank: null,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };
    room.players.set(playerId, hostPlayer);
    socketToPlayer.set(hostSocketId, { roomId: id, playerId });
    hostPlayerId = playerId;
  }

  return { room, hostToken, hostPlayerId };
}

// Join a room
export function joinRoom(
  code: string,
  nickname: string,
  socketId: string
): { success: true; room: Room; player: Player } | { success: false; error: string } {
  const roomId = roomsByCode.get(code.toUpperCase());
  if (!roomId) return { success: false, error: 'That arena doesn\'t exist.' };

  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'That arena doesn\'t exist.' };

  // Check for late join
  if (room.status === 'running' || room.status === 'countdown') {
    if (!room.settings.allowLateJoin) {
      return { success: false, error: 'This arena has already started. Late join is not enabled.' };
    }
  }
  if (room.status === 'finished' || room.status === 'stopped') {
    return { success: false, error: 'This arena has already ended.' };
  }

  const activePlayers = Array.from(room.players.values()).filter(p => p.status !== 'disconnected');
  if (activePlayers.length >= room.settings.maxPlayers) {
    return { success: false, error: 'This arena is already full.' };
  }

  // Check duplicate nickname (case-insensitive)
  const nicknameExists = Array.from(room.players.values()).some(
    p => p.nickname.toLowerCase() === nickname.toLowerCase() && p.status !== 'disconnected'
  );
  if (nicknameExists) {
    return { success: false, error: 'That nickname is already taken in this arena.' };
  }

  const playerId = uuidv4();
  const player: Player = {
    id: playerId,
    nickname: nickname.trim(),
    socketId,
    status: 'waiting',
    progress: 0,
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    incorrectChars: 0,
    finishedAt: null,
    rank: null,
    joinedAt: Date.now(),
    lastSeen: Date.now(),
  };

  room.players.set(playerId, player);
  socketToPlayer.set(socketId, { roomId, playerId });

  return { success: true, room, player };
}

// Get room by code
export function getRoomByCode(code: string): Room | null {
  const roomId = roomsByCode.get(code.toUpperCase());
  if (!roomId) return null;
  return rooms.get(roomId) || null;
}

// Get room by id
export function getRoomById(id: string): Room | null {
  return rooms.get(id) || null;
}

// Get player info by socket
export function getPlayerBySocket(socketId: string): { room: Room; player: Player } | null {
  const info = socketToPlayer.get(socketId);
  if (!info) return null;
  const room = rooms.get(info.roomId);
  if (!room) return null;
  const player = room.players.get(info.playerId);
  if (!player) return null;
  return { room, player };
}

// Get host room by socket
export function getHostRoomBySocket(socketId: string): Room | null {
  const roomId = socketToHost.get(socketId);
  if (!roomId) return null;
  return rooms.get(roomId) || null;
}

// Validate host token
export function validateHostToken(roomCode: string, token: string): Room | null {
  const room = getRoomByCode(roomCode);
  if (!room) return null;
  if (room.hostToken !== token) return null;
  return room;
}

// Update player socket (reconnection)
export function updatePlayerSocket(roomId: string, playerId: string, newSocketId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.get(playerId);
  if (!player) return;

  // Remove the OLD mapping only if the socket ID actually changed
  if (player.socketId && player.socketId !== newSocketId) {
    socketToPlayer.delete(player.socketId);
  }

  // Always guarantee the current socket is mapped — this was the bug:
  // the old code deleted the entry and then skipped re-adding it when
  // the socket ID hadn't changed, leaving the player untrackable.
  socketToPlayer.set(newSocketId, { roomId, playerId });
  player.socketId = newSocketId;
  player.status = player.status === 'disconnected' ? 'waiting' : player.status;
  player.lastSeen = Date.now();

  // Cancel any pending disconnect timer
  const timer = room.disconnectTimers.get(playerId);
  if (timer) {
    clearTimeout(timer);
    room.disconnectTimers.delete(playerId);
  }
}

// Handle player disconnect
export function handlePlayerDisconnect(socketId: string, removeDelay = 30000): {
  room: Room | null;
  player: Player | null;
  isHost: boolean;
} {
  const info = socketToPlayer.get(socketId);
  const isHost = socketToHost.has(socketId);

  if (!info) return { room: null, player: null, isHost };

  const room = rooms.get(info.roomId);
  if (!room) return { room: null, player: null, isHost };

  const player = room.players.get(info.playerId);
  if (!player) return { room, player: null, isHost };

  player.status = 'disconnected';
  player.lastSeen = Date.now();

  // Schedule removal after delay
  const timer = setTimeout(() => {
    const r = rooms.get(info.roomId);
    if (r) {
      r.players.delete(info.playerId);
      socketToPlayer.delete(socketId);
      r.disconnectTimers.delete(info.playerId);
    }
  }, removeDelay);

  room.disconnectTimers.set(info.playerId, timer);

  return { room, player, isHost };
}

// Handle host disconnect
export function handleHostDisconnect(socketId: string): Room | null {
  const roomId = socketToHost.get(socketId);
  if (!roomId) return null;
  const room = rooms.get(roomId);
  if (!room) return null;
  socketToHost.delete(socketId);
  return room;
}

// Register new host socket
export function registerHostSocket(socketId: string, roomId: string): void {
  socketToHost.set(socketId, roomId);
}

// Calculate final rankings for a room
export function calculateRankings(room: Room): void {
  const players = Array.from(room.players.values()).filter(p => p.status !== 'disconnected');

  // Sort: finishers first (by finish time), then non-finishers by progress then wpm then accuracy
  players.sort((a, b) => {
    const aFinished = a.finishedAt !== null;
    const bFinished = b.finishedAt !== null;

    if (aFinished && bFinished) {
      return (a.finishedAt! - b.finishedAt!); // Earlier finish = better
    }
    if (aFinished) return -1;
    if (bFinished) return 1;

    if (b.progress !== a.progress) return b.progress - a.progress;
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return b.accuracy - a.accuracy;
  });

  players.forEach((p, idx) => {
    p.rank = idx + 1;
  });
}

// Reset room for play again
export function resetRoomForPlayAgain(room: Room): void {
  room.status = 'waiting';
  room.startTime = null;
  room.endTime = null;
  room.pausedAt = null;
  room.remainingTime = null;
  room.countdownTarget = null;

  if (room.gameTimer) {
    clearTimeout(room.gameTimer);
    room.gameTimer = null;
  }
  if (room.countdownTimer) {
    clearInterval(room.countdownTimer);
    room.countdownTimer = null;
  }

  // Get new text
  room.currentText = room.settings.textMode === 'custom' && room.settings.customText
    ? room.settings.customText
    : getRandomText(room.settings.difficulty);

  // Reset all players
  room.players.forEach(player => {
    if (player.status !== 'disconnected') {
      player.status = 'waiting';
      player.progress = 0;
      player.wpm = 0;
      player.accuracy = 100;
      player.correctChars = 0;
      player.incorrectChars = 0;
      player.finishedAt = null;
      player.rank = null;
    }
  });
}

// Delete room completely
export function deleteRoom(room: Room): void {
  if (room.gameTimer) clearTimeout(room.gameTimer);
  if (room.countdownTimer) clearInterval(room.countdownTimer);
  room.disconnectTimers.forEach(t => clearTimeout(t));
  if (room.hostDisconnectTimer) clearTimeout(room.hostDisconnectTimer);

  // Clean up socket mappings
  room.players.forEach(player => {
    socketToPlayer.delete(player.socketId);
  });

  roomsByCode.delete(room.code);
  rooms.delete(room.id);
}

export { rooms, socketToPlayer, socketToHost };
