export async function isArticleBookmarked(userId: number, articleId: number): Promise<boolean> {
    const bookmark = await usePrisma().bookmark.findUnique({
        where: {
            userId_articleId: { userId, articleId },
        },
    });
    return !!bookmark;
}

export async function getUserBookmarkCount(userId: number): Promise<number> {
    return usePrisma().bookmark.count({ where: { userId } });
}
