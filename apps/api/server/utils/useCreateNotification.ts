export function useCreateNotification(params: {
    type: "follow" | "favorite" | "comment";
    recipientId: number;
    actorId: number;
    entityId: number;
}) {
    // Don't notify yourself
    if (params.recipientId === params.actorId) return;

    return usePrisma().notification.create({
        data: params,
    });
}
