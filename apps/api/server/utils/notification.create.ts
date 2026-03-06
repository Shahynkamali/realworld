import type { NotificationType } from '~/models/notification.model';

interface CreateNotificationParams {
  type: NotificationType;
  userId: number;
  actorId: number;
  articleId?: number;
  commentId?: number;
}

export const useCreateNotification = async (params: CreateNotificationParams) => {
  if (params.userId === params.actorId) return;

  await usePrisma().notification.create({
    data: {
      type: params.type,
      userId: params.userId,
      actorId: params.actorId,
      articleId: params.articleId,
      commentId: params.commentId,
    },
  });
};
