export interface ReportResponse {
  id: number;
  reportedContentType: string;
  reportedContentId: number;
  reporterId: number;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  reviewedById: number | null;
}
