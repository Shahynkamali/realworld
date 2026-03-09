import HttpException from '~/models/http-exception.model';

export async function requireArticleAccess(slug: string, userId: number, requiredRole: string = 'editor') {
    const article = await usePrisma().article.findUnique({
        where: { slug },
        include: {
            collaborators: {
                where: { userId },
                select: { role: true },
            },
        },
    });

    if (!article) {
        throw new HttpException(404, { errors: { article: ['not found'] } });
    }

    const isAuthor = article.authorId === userId;
    const collaborator = article.collaborators[0];
    const hasAccess = isAuthor || (collaborator && (
        requiredRole === 'viewer' || collaborator.role === 'editor'
    ));

    if (!hasAccess) {
        throw new HttpException(403, { errors: { article: ['access denied'] } });
    }

    return article;
}
