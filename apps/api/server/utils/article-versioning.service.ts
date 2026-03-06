// Creates a version snapshot of the current article state.
// Call this BEFORE applying the update so it captures the pre-edit state.
export async function createVersionSnapshot(articleId: number, authorId: number) {
    const prisma = usePrisma();

    const article = await prisma.article.findUniqueOrThrow({
        where: { id: articleId },
        include: { tagList: { select: { name: true } } },
    });

    const lastVersion = await prisma.articleVersion.findFirst({
        where: { articleId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
    });

    const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

    return prisma.articleVersion.create({
        data: {
            articleId,
            versionNumber: nextVersion,
            title: article.title,
            description: article.description,
            body: article.body,
            tags: JSON.stringify(article.tagList.map(t => t.name)),
            authorId,
            createdAt: article.updatedAt,
        },
    });
}
