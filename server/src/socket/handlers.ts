import { Server, Socket } from 'socket.io';
import {
  createRoom,
  joinRoom,
  getRoomByCode,
  getPlayerBySocket,
  getHostRoomBySocket,
  validateHostToken,
  playerToPublic,
  roomToPublic,
  handlePlayerDisconnect,
  handleHostDisconnect,
  registerHostSocket,
  calculateRankings,
  resetRoomForPlayAgain,
  deleteRoom,
  updatePlayerSocket,
} from '../rooms';
import { Settings, Room, Player } from '../types';

// Sanitize string input
function sanitize(str: string, maxLen = 100): string {
  return str.replace(/<[^>]*>/g, '').trim().substring(0, maxLen);
}

// Broadcast room state to all in room
function broadcastRoomState(io: Server, room: Room): void {
  io.to(room.code).emit('room:state', roomToPublic(room));
}

// Broadcast player list update
function broadcastPlayers(io: Server, room: Room): void {
  const players = Array.from(room.players.values()).map(playerToPublic);
  io.to(room.code).emit('room:players', players);
}

export function registerSocketHandlers(io: Server, socket: Socket): void {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ─── CREATE ROOM ────────────────────────────────────────────────────────────
  socket.on('create:room', (data: {
    settings: Settings;
    hostNickname: string;
    roomName: string;
  }, callback) => {
    try {
      const { settings, hostNickname, roomName } = data;

      // Validate settings
      if (!settings || typeof settings !== 'object') {
        return callback?.({ success: false, error: 'Invalid settings.' });
      }

      const safeSettings: Settings = {
        minPlayers: Math.min(Math.max(Number(settings.minPlayers) || 2, 1), 10),
        maxPlayers: Math.min(Math.max(Number(settings.maxPlayers) || 60, 2), 60),
        duration: [15, 30, 60, 90, 120].includes(Number(settings.duration)) ? Number(settings.duration) : 60,
        difficulty: ['easy', 'medium', 'hard'].includes(settings.difficulty) ? settings.difficulty : 'medium',
        mode: 'classic',
        textMode: settings.textMode === 'custom' ? 'custom' : 'random',
        customText: settings.textMode === 'custom' ? sanitize(settings.customText || '', 2000) : '',
        countdown: [3, 5, 10].includes(Number(settings.countdown)) ? Number(settings.countdown) : 5,
        allowLateJoin: Boolean(settings.allowLateJoin),
        hostPlays: Boolean(settings.hostPlays),
      };

      const safeNickname = sanitize(hostNickname || 'Host', 30) || 'Host';
      const safeRoomName = sanitize(roomName || 'Friday Typing Battle', 60) || 'Friday Typing Battle';

      const { room, hostToken, hostPlayerId } = createRoom(safeSettings, safeNickname, safeRoomName, socket.id);

      socket.join(room.code);

      console.log(`[Room] Created: ${room.code} by ${safeNickname}${safeSettings.hostPlays ? ' (host is racing)' : ''}`);

      callback?.({
        success: true,
        room: roomToPublic(room),
        hostToken,
        hostPlayerId,
      });
    } catch (err) {
      console.error('[create:room] Error:', err);
      callback?.({ success: false, error: 'Failed to create arena.' });
    }
  });

  // ─── JOIN ROOM ───────────────────────────────────────────────────────────────
  socket.on('join:room', (data: {
    code: string;
    nickname: string;
    playerId?: string;
    sessionToken?: string;
  }, callback) => {
    try {
      const code = sanitize(data.code || '', 10).toUpperCase();
      const nickname = sanitize(data.nickname || '', 30);

      if (!code || !nickname) {
        return callback?.({ success: false, error: 'Room code and nickname are required.' });
      }

      const result = joinRoom(code, nickname, socket.id);

      if (!result.success) {
        return callback?.({ success: false, error: result.error });
      }

      const { room, player } = result;

      socket.join(room.code);

      // Notify all players
      io.to(room.code).emit('player:joined', playerToPublic(player));
      broadcastPlayers(io, room);
      broadcastRoomState(io, room);

      console.log(`[Room] ${player.nickname} joined: ${room.code}`);

      callback?.({
        success: true,
        room: roomToPublic(room),
        playerId: player.id,
      });
    } catch (err) {
      console.error('[join:room] Error:', err);
      callback?.({ success: false, error: 'Failed to join arena.' });
    }
  });

  // ─── HOST: START GAME ────────────────────────────────────────────────────────
  socket.on('host:start', (data: { roomCode: string; hostToken: string }, callback) => {
    try {
      const room = validateHostToken(data.roomCode, data.hostToken);
      if (!room) return callback?.({ success: false, error: 'Unauthorized.' });
      if (room.status !== 'waiting') return callback?.({ success: false, error: 'Game is not in waiting state.' });

      const activePlayers = Array.from(room.players.values()).filter(p => p.status !== 'disconnected');
      if (activePlayers.length < room.settings.minPlayers) {
        return callback?.({
          success: false,
          error: `Need at least ${room.settings.minPlayers} players to start. Currently ${activePlayers.length}.`
        });
      }

      // Start countdown
      room.status = 'countdown';
      const countdownEnd = Date.now() + (room.settings.countdown * 1000);
      room.countdownTarget = countdownEnd;

      broadcastRoomState(io, room);
      io.to(room.code).emit('game:countdown', {
        countdownTarget: countdownEnd,
        seconds: room.settings.countdown,
      });

      console.log(`[Room] ${room.code} starting countdown: ${room.settings.countdown}s`);

      // After countdown, start the actual game
      room.countdownTimer = setTimeout(() => {
        if (room.status !== 'countdown') return;

        room.status = 'running';
        room.startTime = Date.now();
        room.endTime = room.startTime + (room.settings.duration * 1000);
        room.countdownTarget = null;

        // Set all active players to typing
        room.players.forEach(p => {
          if (p.status !== 'disconnected') {
            p.status = 'typing';
          }
        });

        broadcastRoomState(io, room);
        io.to(room.code).emit('game:start', {
          startTime: room.startTime,
          endTime: room.endTime,
          text: room.currentText,
        });

        console.log(`[Room] ${room.code} STARTED`);

        // Game timer - end the game when duration is up
        room.gameTimer = setTimeout(() => {
          if (room.status !== 'running') return;
          endGame(io, room);
        }, room.settings.duration * 1000);

      }, room.settings.countdown * 1000) as unknown as NodeJS.Timeout;

      callback?.({ success: true });
    } catch (err) {
      console.error('[host:start] Error:', err);
      callback?.({ success: false, error: 'Failed to start game.' });
    }
  });

  // ─── HOST: PAUSE ─────────────────────────────────────────────────────────────
  socket.on('host:pause', (data: { roomCode: string; hostToken: string }, callback) => {
    try {
      const room = validateHostToken(data.roomCode, data.hostToken);
      if (!room) return callback?.({ success: false, error: 'Unauthorized.' });
      if (room.status !== 'running') return callback?.({ success: false, error: 'Game is not running.' });

      const now = Date.now();
      room.status = 'paused';
      room.pausedAt = now;
      room.remainingTime = room.endTime! - now;

      if (room.gameTimer) {
        clearTimeout(room.gameTimer);
        room.gameTimer = null;
      }

      broadcastRoomState(io, room);
      io.to(room.code).emit('game:paused', { pausedAt: now, remainingTime: room.remainingTime });

      console.log(`[Room] ${room.code} PAUSED`);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: 'Failed to pause game.' });
    }
  });

  // ─── HOST: RESUME ────────────────────────────────────────────────────────────
  socket.on('host:resume', (data: { roomCode: string; hostToken: string }, callback) => {
    try {
      const room = validateHostToken(data.roomCode, data.hostToken);
      if (!room) return callback?.({ success: false, error: 'Unauthorized.' });
      if (room.status !== 'paused') return callback?.({ success: false, error: 'Game is not paused.' });

      const now = Date.now();
      room.status = 'running';
      room.endTime = now + room.remainingTime!;
      room.pausedAt = null;
      room.remainingTime = null;

      broadcastRoomState(io, room);
      io.to(room.code).emit('game:resumed', { endTime: room.endTime });

      // Restart timer
      room.gameTimer = setTimeout(() => {
        if (room.status !== 'running') return;
        endGame(io, room);
      }, room.endTime - now) as unknown as NodeJS.Timeout;

      console.log(`[Room] ${room.code} RESUMED`);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: 'Failed to resume game.' });
    }
  });

  // ─── HOST: STOP ──────────────────────────────────────────────────────────────
  socket.on('host:stop', (data: { roomCode: string; hostToken: string }, callback) => {
    try {
      const room = validateHostToken(data.roomCode, data.hostToken);
      if (!room) return callback?.({ success: false, error: 'Unauthorized.' });

      if (room.gameTimer) { clearTimeout(room.gameTimer); room.gameTimer = null; }
      if (room.countdownTimer) { clearTimeout(room.countdownTimer as unknown as NodeJS.Timeout); room.countdownTimer = null; }

      room.status = 'stopped';
      room.pausedAt = null;
      room.remainingTime = null;

      broadcastRoomState(io, room);
      io.to(room.code).emit('game:stopped');

      console.log(`[Room] ${room.code} STOPPED`);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: 'Failed to stop game.' });
    }
  });

  // ─── HOST: RESTART ───────────────────────────────────────────────────────────
  socket.on('host:restart', (data: { roomCode: string; hostToken: string }, callback) => {
    try {
      const room = validateHostToken(data.roomCode, data.hostToken);
      if (!room) return callback?.({ success: false, error: 'Unauthorized.' });

      resetRoomForPlayAgain(room);

      broadcastRoomState(io, room);
      broadcastPlayers(io, room);
      io.to(room.code).emit('game:restarted');

      console.log(`[Room] ${room.code} RESTARTED`);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: 'Failed to restart game.' });
    }
  });

  // ─── HOST: END ARENA ─────────────────────────────────────────────────────────
  socket.on('host:end', (data: { roomCode: string; hostToken: string }, callback) => {
    try {
      const room = validateHostToken(data.roomCode, data.hostToken);
      if (!room) return callback?.({ success: false, error: 'Unauthorized.' });

      io.to(room.code).emit('room:ended', { reason: 'Host ended the arena.' });

      deleteRoom(room);

      console.log(`[Room] ${data.roomCode} ENDED`);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ success: false, error: 'Failed to end arena.' });
    }
  });

  // ─── PLAYER: PROGRESS UPDATE ─────────────────────────────────────────────────
  socket.on('player:progress', (data: {
    roomCode: string;
    playerId: string;
    progress: number;
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
  }) => {
    try {
      const info = getPlayerBySocket(socket.id);
      if (!info) return;

      const { room, player } = info;
      if (room.code !== data.roomCode) return;
      if (player.id !== data.playerId) return;
      if (room.status !== 'running') return;
      if (player.status === 'finished' || player.status === 'disconnected') return;

      // Validate progress boundaries
      const progress = Math.min(100, Math.max(0, Number(data.progress) || 0));
      const wpm = Math.min(300, Math.max(0, Number(data.wpm) || 0));
      const accuracy = Math.min(100, Math.max(0, Number(data.accuracy) || 0));

      player.progress = progress;
      player.wpm = wpm;
      player.accuracy = accuracy;
      player.correctChars = Number(data.correctChars) || 0;
      player.incorrectChars = Number(data.incorrectChars) || 0;
      player.lastSeen = Date.now();

      // Broadcast to room
      io.to(room.code).emit('player:updated', playerToPublic(player));
    } catch (err) {
      console.error('[player:progress] Error:', err);
    }
  });

  // ─── PLAYER: FINISH ──────────────────────────────────────────────────────────
  socket.on('player:finish', (data: {
    roomCode: string;
    playerId: string;
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
  }, callback) => {
    try {
      const info = getPlayerBySocket(socket.id);
      if (!info) return callback?.({ success: false, error: 'Not in room.' });

      const { room, player } = info;
      if (room.code !== data.roomCode) return callback?.({ success: false, error: 'Room mismatch.' });
      if (player.id !== data.playerId) return callback?.({ success: false, error: 'Player mismatch.' });
      if (room.status !== 'running') return callback?.({ success: false });
      if (player.status === 'finished') return callback?.({ success: true }); // Already finished

      // Validate timing - must be within game window
      const now = Date.now();
      if (room.startTime && now < room.startTime) return callback?.({ success: false, error: 'Game not started yet.' });

      player.status = 'finished';
      player.progress = 100;
      player.finishedAt = now;
      player.wpm = Math.min(300, Math.max(0, Number(data.wpm) || 0));
      player.accuracy = Math.min(100, Math.max(0, Number(data.accuracy) || 0));
      player.correctChars = Number(data.correctChars) || 0;
      player.incorrectChars = Number(data.incorrectChars) || 0;

      // Recalculate rankings
      calculateRankings(room);

      io.to(room.code).emit('player:updated', playerToPublic(player));
      broadcastPlayers(io, room);

      console.log(`[Room] ${room.code} - ${player.nickname} FINISHED: ${player.wpm} WPM`);

      // Check if all active players finished
      const activePlayers = Array.from(room.players.values()).filter(p =>
        p.status !== 'disconnected' && p.status !== 'finished'
      );

      if (activePlayers.length === 0) {
        endGame(io, room);
      }

      callback?.({ success: true, rank: player.rank });
    } catch (err) {
      console.error('[player:finish] Error:', err);
      callback?.({ success: false, error: 'Failed to record finish.' });
    }
  });

  // ─── RECONNECT ───────────────────────────────────────────────────────────────
  socket.on('reconnect:player', (data: { roomCode: string; playerId: string }, callback) => {
    try {
      const room = getRoomByCode(data.roomCode);
      if (!room) return callback?.({ success: false, error: 'Room not found.' });

      const player = room.players.get(data.playerId);
      if (!player) return callback?.({ success: false, error: 'Player not found.' });

      updatePlayerSocket(room.id, data.playerId, socket.id);
      socket.join(room.code);

      callback?.({ success: true, room: roomToPublic(room), playerId: player.id });
      broadcastPlayers(io, room);
    } catch (err) {
      callback?.({ success: false, error: 'Reconnection failed.' });
    }
  });

  // ─── RECONNECT HOST ──────────────────────────────────────────────────────────
  socket.on('reconnect:host', (data: { roomCode: string; hostToken: string }, callback) => {
    try {
      const room = validateHostToken(data.roomCode, data.hostToken);
      if (!room) return callback?.({ success: false, error: 'Unauthorized.' });

      room.hostSocketId = socket.id;
      registerHostSocket(socket.id, room.id);
      socket.join(room.code);

      // Cancel host disconnect timer
      if (room.hostDisconnectTimer) {
        clearTimeout(room.hostDisconnectTimer);
        room.hostDisconnectTimer = null;
      }

      callback?.({ success: true, room: roomToPublic(room) });
    } catch (err) {
      callback?.({ success: false, error: 'Host reconnection failed.' });
    }
  });

  // ─── DISCONNECT ──────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);

    const isHost = getHostRoomBySocket(socket.id);
    if (isHost) {
      const room = handleHostDisconnect(socket.id);
      if (room) {
        io.to(room.code).emit('host:disconnected', { message: 'Host disconnected. Waiting for reconnection...' });

        // Give host 60 seconds to reconnect
        room.hostDisconnectTimer = setTimeout(() => {
          const currentRoom = getRoomByCode(room.code);
          if (currentRoom && currentRoom.hostSocketId !== socket.id) return; // Host reconnected

          io.to(room.code).emit('room:ended', { reason: 'Host disconnected and did not reconnect.' });
          deleteRoom(room);
          console.log(`[Room] ${room.code} ended - host did not reconnect`);
        }, 60000);
      }
    }

    const { room, player } = handlePlayerDisconnect(socket.id, 30000);
    if (room && player) {
      io.to(room.code).emit('player:updated', playerToPublic(player));
      broadcastPlayers(io, room);

      console.log(`[Room] ${room.code} - ${player.nickname} disconnected`);
    }
  });
}

// End game helper
function endGame(io: Server, room: Room): void {
  if (room.status === 'finished') return;

  room.status = 'finished';

  if (room.gameTimer) { clearTimeout(room.gameTimer); room.gameTimer = null; }

  // For players who didn't finish (timer ran out), compute final WPM from server-side data
  // so the results page always has accurate numbers regardless of the last client update.
  if (room.startTime) {
    const now = Date.now();
    room.players.forEach(p => {
      if (p.status === 'typing') {
        // Player was still typing when time ran out
        const elapsedMs = Math.max(now - room.startTime!, 1000);
        const minutes = elapsedMs / 60000;
        p.wpm = p.correctChars > 0 ? Math.round(p.correctChars / 5 / minutes) : 0;
        p.wpm = Math.min(p.wpm, 300); // sanity cap
      }
    });
  }

  calculateRankings(room);

  const results = Array.from(room.players.values())
    .filter(p => p.status !== 'disconnected')
    .map(playerToPublic)
    .sort((a, b) => (a.rank || 99) - (b.rank || 99));

  broadcastRoomState(io, room);
  io.to(room.code).emit('game:finished', { results });

  console.log(`[Room] ${room.code} FINISHED`);
}
