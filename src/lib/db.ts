import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

/**
 * Open a cached MongoDB connection for request handlers.
 * Heavy one-off migrations (unifyStylistProfiles / hiring indexes) are NOT run here —
 * use `runDatabaseMigrations()` or `npm run db:migrate` when needed.
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define MONGODB_URI in your environment variables");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      autoIndex: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/** One-off / deploy-time data + index migrations (not on the request path). */
export async function runDatabaseMigrations(): Promise<void> {
  const { unifyStylistProfiles } = await import("@/lib/stylist-merge");
  const { ensureHiringIndexes } = await import("@/lib/hiring");
  await connectDB();
  await unifyStylistProfiles();
  await ensureHiringIndexes();
}
