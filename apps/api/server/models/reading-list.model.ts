export interface ReadingListResponse {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  articlesCount?: number;
}
