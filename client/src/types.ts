// Shared types for TypingArena client

export type GameStatus = 'waiting' | 'countdown' | 'running' | 'paused' | 'finished' | 'stopped';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic';
export type TextMode = 'random' | 'custom';
export type PlayerStatus = 'waiting' | 'ready' | 'typing' | 'finished' | 'disconnected';

export interface Settings {
  minPlayers: number;
  maxPlayers: number;
  duration: number;
  difficulty: Difficulty;
  mode: GameMode;
  textMode: TextMode;
  customText: string;
  countdown: number;
  allowLateJoin: boolean;
  hostPlays: boolean;
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

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
