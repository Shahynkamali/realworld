export default defineNitroPlugin(() => {
    setInterval(async () => {
        await usePrisma().article.updateMany({
            where: { status: 'scheduled', publishedAt: { lte: new Date() } },
            data: { status: 'published', updatedAt: new Date() },
        });
    }, 60_000);
});
