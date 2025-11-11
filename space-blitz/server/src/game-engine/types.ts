export interface GameUpdateResult {
  success: boolean;
  gameEnded: boolean;
  message?: string;
  error?: string;
}