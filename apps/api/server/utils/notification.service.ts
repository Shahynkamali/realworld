type NotificationType = 'FOLLOW' | 'FAVORITE' | 'COMMENT' | 'COLLABORATION_INVITE' | 'REVISION_CHANGE';

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  'FOLLOW', 'FAVORITE', 'COMMENT', 'COLLABORATION_INVITE', 'REVISION_CHANGE',
] as const;

interface CreateNotificationParams {
  type: NotificationType;
  userId: number;     // recipient
  actorId: number;    // who triggered it
  entityId?: number;
  entityType?: string;
  message: string;
}

// In-memory map of userId -> SSE send functions
const sseClients = new Map<number, Set<(data: string) => void>>();

export function addSSEClient(userId: number, send: (data: string) => void) {
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId)!.add(send);
}

export function removeSSEClient(userId: number, send: (data: string) => void) {
  const clients = sseClients.get(userId);
  if (clients) {
    clients.delete(send);
    if (clients.size === 0) sseClients.delete(userId);
  }
}

export function getSSEClientCount(userId: number): number {
  return sseClients.get(userId)?.size ?? 0;
}

function pushToSSE(userId: number, notification: any) {
  const clients = sseClients.get(userId);
  if (clients) {
    const data = JSON.stringify(notification);
    for (const send of clients) {
      try {
        send(data);
      } catch {
        // Client may have disconnected — skip silently
      }
    }
  }
}

async function isNotificationEnabled(userId: number, type: NotificationType): Promise<boolean> {
  const pref = await usePrisma().notificationPreference.findUnique({
    where: { userId_notificationType: { userId, notificationType: type } },
  });
  // Default enabled if no preference exists
  return pref ? pref.isEnabled : true;
}

async function createNotification(params: CreateNotificationParams) {
  // Don't notify yourself
  if (params.userId === params.actorId) return null;

  const enabled = await isNotificationEnabled(params.userId, params.type);
  if (!enabled) return null;

  const notification = await usePrisma().notification.create({
    data: {
      type: params.type,
      userId: params.userId,
      actorId: params.actorId,
      entityId: params.entityId ?? null,
      entityType: params.entityType ?? null,
      message: params.message,
    },
    include: {
      actor: {
        select: { username: true, image: true },
      },
    },
  });

  pushToSSE(params.userId, notification);
  return notification;
}

export async function notifyFollow(actorId: number, actorUsername: string, targetUserId: number) {
  return createNotification({
    type: 'FOLLOW',
    userId: targetUserId,
    actorId,
    entityId: targetUserId,
    entityType: 'user',
    message: `@${actorUsername} followed you`,
  });
}

export async function notifyFavorite(actorId: number, actorUsername: string, article: { id: number; title: string; authorId: number }) {
  return createNotification({
    type: 'FAVORITE',
    userId: article.authorId,
    actorId,
    entityId: article.id,
    entityType: 'article',
    message: `@${actorUsername} favorited your article "${article.title}"`,
  });
}

export async function notifyComment(actorId: number, actorUsername: string, article: { id: number; title: string; authorId: number }) {
  return createNotification({
    type: 'COMMENT',
    userId: article.authorId,
    actorId,
    entityId: article.id,
    entityType: 'article',
    message: `@${actorUsername} commented on your article "${article.title}"`,
  });
}

export async function notifyCollaborationInvite(actorId: number, actorUsername: string, invitedUserId: number, article: { id: number; title: string }) {
  return createNotification({
    type: 'COLLABORATION_INVITE',
    userId: invitedUserId,
    actorId,
    entityId: article.id,
    entityType: 'article',
    message: `@${actorUsername} invited you to collaborate on "${article.title}"`,
  });
}

export async function notifyRevisionChange(actorId: number, actorUsername: string, article: { id: number; title: string; authorId: number }, collaboratorUserIds: number[]) {
  const recipientIds = [article.authorId, ...collaboratorUserIds].filter(id => id !== actorId);
  const uniqueIds = [...new Set(recipientIds)];

  return Promise.all(
    uniqueIds.map(userId =>
      createNotification({
        type: 'REVISION_CHANGE',
        userId,
        actorId,
        entityId: article.id,
        entityType: 'article',
        message: `@${actorUsername} made changes to "${article.title}"`,
      })
    )
  );
}
