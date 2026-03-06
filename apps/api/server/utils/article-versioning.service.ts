// Creates a version snapshot of the current article state.
// Call this BEFORE applying the update so it captures the pre-edit state.
// Accepts an optional transaction client for atomicity with the parent operation.
export async function createVersionSnapshot(articleId: number, authorId: number, tx?: any) {
    const db = tx ?? usePrisma();

    const article = await db.article.findUniqueOrThrow({
        where: { id: articleId },
        include: { tagList: { select: { name: true } } },
    });

    const lastVersion = await db.articleVersion.findFirst({
        where: { articleId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
    });

    const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

    return db.articleVersion.create({
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

export function parseVersionTags(version: { tags: string }): string[] {
    return JSON.parse(version.tags);
}
