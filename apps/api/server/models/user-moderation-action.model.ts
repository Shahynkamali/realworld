export interface UserModerationActionResponse {
  id: number;
  userId: number;
  actionType: string;
  reason: string;
  issuedById: number;
  issuedAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
}
