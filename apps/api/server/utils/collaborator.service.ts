import HttpException from '~/models/http-exception.model';

export const requireArticleAccess = async (slug: string, userId: number, _role: string) => {
    const article = await usePrisma().article.findUnique({
        where: { slug },
    });

    if (!article) {
        throw new HttpException(404, { errors: { article: ['not found'] } });
    }

    if (article.authorId !== userId) {
        // Check collaborator access
        const collaborator = await usePrisma().articleCollaborator.findUnique({
            where: { articleId_userId: { articleId: article.id, userId } },
        });

        if (!collaborator) {
            throw new HttpException(403, { errors: { article: ['access denied'] } });
        }
    }

    return article;
};
