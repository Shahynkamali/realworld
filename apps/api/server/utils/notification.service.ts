type NotificationType = 'follow' | 'favorite' | 'comment' | 'reply';

interface CreateNotificationParams {
    recipientId: number;
    type: NotificationType;
    message: string;
    relatedEntityId?: number;
    relatedEntityType?: string;
}

/**
 * Creates a notification if the recipient has the notification type enabled.
 * Default preferences allow all types — only skip if explicitly disabled.
 * Does not notify if recipientId === the actor (no self-notifications).
 */
export async function createNotification(params: CreateNotificationParams & { actorId: number }): Promise<void> {
    // Don't notify yourself
    if (params.recipientId === params.actorId) return;

    // Check user preferences
    const preference = await usePrisma().notificationPreference.findUnique({
        where: {
            userId_notificationType: {
                userId: params.recipientId,
                notificationType: params.type,
            },
        },
    });

    // Default is enabled — only skip if explicitly disabled
    if (preference && !preference.isEnabled) return;

    await usePrisma().notification.create({
        data: {
            userId: params.recipientId,
            type: params.type,
            message: params.message,
            relatedEntityId: params.relatedEntityId ?? null,
            relatedEntityType: params.relatedEntityType ?? null,
        },
    });
}

export async function notifyFollow(followerId: number, followedUserId: number, followerUsername: string): Promise<void> {
    await createNotification({
        recipientId: followedUserId,
        actorId: followerId,
        type: 'follow',
        message: `@${followerUsername} followed you`,
        relatedEntityId: followerId,
        relatedEntityType: 'user',
    });
}

export async function notifyFavorite(userId: number, articleAuthorId: number, username: string, articleTitle: string, articleId: number): Promise<void> {
    await createNotification({
        recipientId: articleAuthorId,
        actorId: userId,
        type: 'favorite',
        message: `@${username} favorited your article "${articleTitle}"`,
        relatedEntityId: articleId,
        relatedEntityType: 'article',
    });
}

export async function notifyComment(commenterId: number, articleAuthorId: number, commenterUsername: string, articleTitle: string, articleId: number): Promise<void> {
    await createNotification({
        recipientId: articleAuthorId,
        actorId: commenterId,
        type: 'comment',
        message: `@${commenterUsername} commented on your article "${articleTitle}"`,
        relatedEntityId: articleId,
        relatedEntityType: 'article',
    });
}

export async function getDefaultPreferences(): { notificationType: string; isEnabled: boolean }[] {
    return [
        { notificationType: 'follow', isEnabled: true },
        { notificationType: 'favorite', isEnabled: true },
        { notificationType: 'comment', isEnabled: true },
        { notificationType: 'reply', isEnabled: true },
    ];
}
