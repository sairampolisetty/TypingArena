// Shared types for TypingArena server

export type GameStatus = 'waiting' | 'countdown' | 'running' | 'paused' | 'finished' | 'stopped';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type GameMode = 'classic';

export type TextMode = 'random' | 'custom';

export type PlayerStatus = 'waiting' | 'ready' | 'typing' | 'finished' | 'disconnected';

export interface Settings {
  minPlayers: number;
  maxPlayers: number;
  duration: number; // seconds
  difficulty: Difficulty;
  mode: GameMode;
  textMode: TextMode;
  customText: string;
  countdown: number; // seconds
  allowLateJoin: boolean;
  hostPlays: boolean; // host participates in the race as a player
}

export interface Player {
  id: string;
  nickname: string;
  socketId: string;
  status: PlayerStatus;
  progress: number; // 0-100
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  finishedAt: number | null;
  rank: number | null;
  joinedAt: number;
  lastSeen: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostToken: string;
  hostSocketId: string;
  status: GameStatus;
  settings: Settings;
  players: Map<string, Player>;
  currentText: string;
  createdAt: number;
  startTime: number | null;
  endTime: number | null;
  pausedAt: number | null;
  remainingTime: number | null;
  countdownTarget: number | null;
  gameTimer: NodeJS.Timeout | null;
  countdownTimer: NodeJS.Timeout | null;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  hostDisconnectTimer: NodeJS.Timeout | null;
}

export interface PlayerPublic {
  id: string;
  nickname: string;
  status: PlayerStatus;
  progress: number;
  wpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  finishedAt: number | null;
  rank: number | null;
}

export interface RoomPublic {
  id: string;
  code: string;
  name: string;
  status: GameStatus;
  settings: Settings;
  players: PlayerPublic[];
  currentText: string;
  createdAt: number;
  startTime: number | null;
  endTime: number | null;
  pausedAt: number | null;
  remainingTime: number | null;
  countdownTarget: number | null;
  playerCount: number;
}
