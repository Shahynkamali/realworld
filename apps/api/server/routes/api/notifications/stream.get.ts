import { useVerifyToken } from '~/utils/verify-token';
import { useSSEConnections } from '~/utils/sse-connections';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  if (!token) {
    throw createError({
      status: 401,
      statusMessage: 'Unauthorized',
      data: { errors: { token: ['is missing'] } },
    });
  }

  const auth = useVerifyToken(token);

  const stream = createEventStream(event);
  const sse = useSSEConnections();

  sse.add(auth.id, stream);

  stream.onClosed(() => {
    sse.remove(auth.id, stream);
    stream.close();
  });

  return stream.send();
});
