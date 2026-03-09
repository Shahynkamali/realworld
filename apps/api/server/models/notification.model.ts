export interface NotificationResponse {
    id: number;
    type: string;
    message: string;
    isRead: boolean;
    relatedEntityId: number | null;
    relatedEntityType: string | null;
    createdAt: Date;
}
