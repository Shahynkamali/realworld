export interface AppealResponse {
  id: number;
  userId: number;
  moderationActionId: number;
  reason: string;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedById: number | null;
}
