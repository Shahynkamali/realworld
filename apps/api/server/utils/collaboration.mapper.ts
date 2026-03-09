const collaborationMapper = (collaboration: any) => ({
  id: collaboration.id,
  status: collaboration.status,
  createdAt: collaboration.createdAt,
  article: {
    slug: collaboration.article.slug,
    title: collaboration.article.title,
  },
  inviter: {
    username: collaboration.inviter.username,
    bio: collaboration.inviter.bio,
    image: collaboration.inviter.image,
  },
  invitee: {
    username: collaboration.invitee.username,
    bio: collaboration.invitee.bio,
    image: collaboration.invitee.image,
  },
});

export default collaborationMapper;
