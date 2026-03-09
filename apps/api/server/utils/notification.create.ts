import type { NotificationType } from '~/models/notification.model';
import notificationMapper from './notification.mapper';
import { useSSEConnections } from './sse-connections';

interface CreateNotificationParams {
  type: NotificationType;
  userId: number;
  actorId: number;
  articleId?: number;
  commentId?: number;
  collaborationId?: number;
}

const notificationInclude = {
  actor: { select: { username: true, bio: true, image: true } },
  article: { select: { slug: true, title: true } },
  comment: { select: { id: true, body: true } },
  collaboration: { select: { id: true, status: true } },
};

export const useCreateNotification = async (params: CreateNotificationParams) => {
  if (params.userId === params.actorId) return null;

  const preference = await usePrisma().notificationPreference.findUnique({
    where: { userId_type: { userId: params.userId, type: params.type } },
  });

  if (preference && !preference.enabled) return null;

  const notification = await usePrisma().notification.create({
    data: {
      type: params.type,
      userId: params.userId,
      actorId: params.actorId,
      articleId: params.articleId,
      commentId: params.commentId,
      collaborationId: params.collaborationId,
    },
    include: notificationInclude,
  });

  const mapped = notificationMapper(notification);
  useSSEConnections().push(params.userId, JSON.stringify(mapped));

  return notification;
};
