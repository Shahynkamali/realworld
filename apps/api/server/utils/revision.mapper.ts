const revisionMapper = (revision: any) => ({
  id: revision.id,
  title: revision.title,
  description: revision.description,
  body: revision.body,
  createdAt: revision.createdAt,
  author: {
    username: revision.author.username,
    bio: revision.author.bio,
    image: revision.author.image,
  },
});

export default revisionMapper;
