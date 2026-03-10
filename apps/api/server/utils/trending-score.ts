export function calculateTrendingScore(
    viewCount: number,
    favoritesCount: number,
    createdAt: Date,
    now: Date = new Date(),
): number {
    const engagement = viewCount * 1 + favoritesCount * 3;
    if (engagement === 0) return 0;

    const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const decay = Math.max(0.1, 1 / (1 + ageHours / 24));

    return engagement * decay;
}
