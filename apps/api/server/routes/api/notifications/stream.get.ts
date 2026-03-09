import { definePrivateEventHandler } from "~/auth-event-handler";
import { useVerifyToken } from "~/utils/verify-token";
import { addSSEClient, removeSSEClient } from "~/utils/notification.service";

export default defineEventHandler(async (event) => {
  // SSE clients (browser EventSource) cannot send custom headers,
  // so we authenticate via a query param: ?token=<jwt>
  const query = getQuery(event);
  const token = query.token as string | undefined;

  if (!token) {
    throw createError({
      status: 401,
      statusMessage: 'Unauthorized',
      data: { errors: { token: ['is required as query parameter'] } },
    });
  }

  const auth = useVerifyToken(token);

  const eventStream = createEventStream(event);

  const send = (data: string) => {
    eventStream.push({ event: 'notification', data }).catch(() => {
      // Client disconnected — ignore write errors
    });
  };

  addSSEClient(auth.id, send);

  // Send initial connection confirmation
  await eventStream.push({ event: 'connected', data: JSON.stringify({ userId: auth.id }) });

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    eventStream.push({ event: 'heartbeat', data: '' }).catch(() => {
      // Client disconnected — cleanup will happen via onClosed
    });
  }, 30_000);

  eventStream.onClosed(() => {
    clearInterval(heartbeat);
    removeSSEClient(auth.id, send);
  });

  return eventStream.send();
});
