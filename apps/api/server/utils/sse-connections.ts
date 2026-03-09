import type { EventStream } from 'h3';

const connections = new Map<number, Set<EventStream>>();

export const useSSEConnections = () => ({
  add(userId: number, stream: EventStream) {
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId)!.add(stream);
  },

  remove(userId: number, stream: EventStream) {
    const streams = connections.get(userId);
    if (streams) {
      streams.delete(stream);
      if (streams.size === 0) {
        connections.delete(userId);
      }
    }
  },

  async push(userId: number, data: string) {
    const streams = connections.get(userId);
    if (!streams) return;
    for (const stream of streams) {
      await stream.push({ event: 'notification', data });
    }
  },
});
