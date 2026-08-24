import mongoose from "mongoose";
import { unifyStylistProfiles } from "@/lib/stylist-merge";
import { ensureHiringIndexes } from "@/lib/hiring";

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
  await unifyStylistProfiles();
  await ensureHiringIndexes();
  return cached.conn;
}
