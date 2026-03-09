import HttpException from "~/models/http-exception.model";

type CollaboratorRole = 'editor' | 'viewer';

/**
 * Finds an article by slug and checks if the user has the required collaborator role.
 * Returns the article if access is granted.
 */
export async function requireArticleAccess(
  slug: string,
  userId: number,
  requiredRole: CollaboratorRole | 'author',
) {
  const article = await usePrisma().article.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      authorId: true,
      collaborators: {
        where: { userId },
        select: { role: true, acceptedAt: true },
      },
    },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  if (article.authorId === userId) {
    return article;
  }

  const collab = article.collaborators[0];

  if (!collab || !collab.acceptedAt) {
    throw new HttpException(403, { errors: { article: ['forbidden'] } });
  }

  if (requiredRole === 'author') {
    throw new HttpException(403, { errors: { article: ['only the author can perform this action'] } });
  }

  if (requiredRole === 'editor' && collab.role !== 'editor') {
    throw new HttpException(403, { errors: { article: ['editor access required'] } });
  }

  return article;
}
