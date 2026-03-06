export const publishedArticleFilter = (authId?: number) => {
    if (authId) {
        return { OR: [{ status: 'published' }, { authorId: authId }] };
    }
    return { status: 'published' };
};

export const draftFilter = (authId: number) => ({
    status: { in: ['draft', 'scheduled'] },
    authorId: authId,
});
