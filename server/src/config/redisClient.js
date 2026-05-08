import { createClient } from 'redis';

// Create Redis client (ES module)
const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// Handle connection events
client.on('error', (err) => {
  console.error('Redis Client Error', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

// Connect (fire-and-forget)
client.connect().catch((err) => console.error('Redis connection failed', err));

export default client;