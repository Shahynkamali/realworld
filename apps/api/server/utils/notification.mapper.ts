const notificationMapper = (notification: any) => ({
  id: notification.id,
  type: notification.type,
  read: notification.read,
  createdAt: notification.createdAt,
  actor: {
    username: notification.actor.username,
    bio: notification.actor.bio,
    image: notification.actor.image,
  },
  article: notification.article
    ? { slug: notification.article.slug, title: notification.article.title }
    : null,
  comment: notification.comment
    ? { id: notification.comment.id, body: notification.comment.body }
    : null,
  collaboration: notification.collaboration
    ? { id: notification.collaboration.id, status: notification.collaboration.status }
    : null,
});

export default notificationMapper;
