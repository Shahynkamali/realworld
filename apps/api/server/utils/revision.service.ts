import HttpException from "~/models/http-exception.model";

export async function createRevision(articleId: number, authorId: number) {
  const article = await usePrisma().article.findUnique({
    where: { id: articleId },
    select: { title: true, description: true, body: true },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  return usePrisma().articleRevision.create({
    data: {
      articleId,
      authorId,
      title: article.title,
      description: article.description,
      body: article.body,
    },
  });
}

const AUTHOR_SELECT = {
  username: true,
  bio: true,
  image: true,
  followedBy: true,
};

export async function listRevisions(articleSlug: string, limit: number, offset: number) {
  const article = await usePrisma().article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  const [revisions, revisionsCount] = await Promise.all([
    usePrisma().articleRevision.findMany({
      where: { articleId: article.id },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        author: { select: AUTHOR_SELECT },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    usePrisma().articleRevision.count({ where: { articleId: article.id } }),
  ]);

  return { revisions, revisionsCount };
}

export async function getRevision(articleSlug: string, revisionId: number) {
  const article = await usePrisma().article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  const revision = await usePrisma().articleRevision.findFirst({
    where: { id: revisionId, articleId: article.id },
    include: { author: { select: AUTHOR_SELECT } },
  });

  if (!revision) {
    throw new HttpException(404, { errors: { revision: ['not found'] } });
  }

  return revision;
}

export async function restoreRevision(articleSlug: string, revisionId: number, userId: number) {
  const article = await usePrisma().article.findUnique({
    where: { slug: articleSlug },
    select: { id: true, authorId: true },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  if (article.authorId !== userId) {
    throw new HttpException(403, { errors: { article: ['only the author can restore revisions'] } });
  }

  const revision = await usePrisma().articleRevision.findFirst({
    where: { id: revisionId, articleId: article.id },
  });

  if (!revision) {
    throw new HttpException(404, { errors: { revision: ['not found'] } });
  }

  return usePrisma().$transaction(async (tx) => {
    // Snapshot current state before restoring
    const current = await tx.article.findUnique({
      where: { id: article.id },
      select: { title: true, description: true, body: true },
    });

    await tx.articleRevision.create({
      data: {
        articleId: article.id,
        authorId: userId,
        title: current!.title,
        description: current!.description,
        body: current!.body,
      },
    });

    // Restore article to the revision state
    return tx.article.update({
      where: { id: article.id },
      data: {
        title: revision.title,
        description: revision.description,
        body: revision.body,
        updatedAt: new Date(),
      },
      include: {
        tagList: { select: { name: true } },
        author: { select: AUTHOR_SELECT },
        favoritedBy: true,
        _count: { select: { favoritedBy: true } },
      },
    });
  });
}
