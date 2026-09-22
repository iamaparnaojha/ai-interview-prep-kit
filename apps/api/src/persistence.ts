import { MongoClient, ObjectId, type Collection, type Db, type Document } from 'mongodb';
import type { Kit } from '@prep/kit-core';

type UserRecord = { _id?: ObjectId; id: string; email: string; passwordHash: string; createdAt: string; updatedAt: string };
type SessionRecord = { _id?: ObjectId; token: string; userId: string; expiresAt: Date };
type KitRecord = { _id?: ObjectId; id: string; userId: string; kit: Kit; version: number; status: 'ready' | 'generating' | 'failed'; progress: { stage: string; status: string }[]; createdAt: string; updatedAt: string };
type PracticeRecord = { _id?: ObjectId; userId: string; kitId: string; flashcardId: string; confidence: number; attempts: number; covered: boolean; lastPracticed: string };

export type Persistence = ReturnType<typeof createPersistence>;

export function createPersistence() {
  const memory = { users: new Map<string, UserRecord>(), sessions: new Map<string, SessionRecord>(), kits: new Map<string, KitRecord>(), practice: new Map<string, PracticeRecord>() };
  let client: MongoClient | undefined;
  let dbPromise: Promise<Db | null> | undefined;
  const useMongo = Boolean(process.env.MONGODB_URI);
  async function db() {
    if (!useMongo) return null;
    if (!dbPromise) {
      dbPromise = (async () => {
        client = new MongoClient(process.env.MONGODB_URI!);
        await client.connect();
        const database = client.db(process.env.MONGODB_DB || 'ai_interview_prep');
        await Promise.all([
          database.collection<UserRecord>('users').createIndex({ email: 1 }, { unique: true }),
          database.collection<SessionRecord>('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
          database.collection<KitRecord>('kits').createIndex({ userId: 1, updatedAt: -1 }),
          database.collection<PracticeRecord>('practice').createIndex({ userId: 1, kitId: 1, flashcardId: 1 }, { unique: true })
        ]);
        return database;
      })();
    }
    return dbPromise;
  }
  async function collection<T extends Document>(name: string): Promise<Collection<T> | null> { const database = await db(); return database?.collection<T>(name) || null; }
  return {
    async close() { await client?.close(); },
    async createUser(user: UserRecord) { const users = await collection<UserRecord>('users'); if (users) { await users.insertOne(user); return user; } memory.users.set(user.id, user); return user; },
    async findUserByEmail(email: string) { const users = await collection<UserRecord>('users'); return users ? users.findOne({ email }) : [...memory.users.values()].find((user) => user.email === email) || null; },
    async findUserById(id: string) { const users = await collection<UserRecord>('users'); return users ? users.findOne({ id }) : memory.users.get(id) || null; },
    async createSession(session: SessionRecord) { const sessions = await collection<SessionRecord>('sessions'); if (sessions) { await sessions.insertOne(session); return; } memory.sessions.set(session.token, session); },
    async findSession(token: string) { const sessions = await collection<SessionRecord>('sessions'); return sessions ? sessions.findOne({ token, expiresAt: { $gt: new Date() } }) : memory.sessions.get(token) && memory.sessions.get(token)!.expiresAt > new Date() ? memory.sessions.get(token)! : null; },
    async deleteSession(token: string) { const sessions = await collection<SessionRecord>('sessions'); if (sessions) { await sessions.deleteOne({ token }); return; } memory.sessions.delete(token); },
    async listKits(userId: string) { const kits = await collection<KitRecord>('kits'); return kits ? kits.find({ userId }).sort({ updatedAt: -1 }).toArray() : [...memory.kits.values()].filter((kit) => kit.userId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); },
    async getKit(id: string, userId: string) { const kits = await collection<KitRecord>('kits'); return kits ? kits.findOne({ id, userId }) : memory.kits.get(id)?.userId === userId ? memory.kits.get(id)! : null; },
    async createKit(record: KitRecord) { const kits = await collection<KitRecord>('kits'); if (kits) { await kits.insertOne(record); return record; } memory.kits.set(record.id, record); return record; },
    async deleteKit(id: string, userId: string) { const kits = await collection<KitRecord>('kits'); if (kits) return (await kits.deleteOne({ id, userId })).deletedCount > 0; const current = memory.kits.get(id); if (!current || current.userId !== userId) return false; memory.kits.delete(id); return true; },
    async updateKit(id: string, userId: string, version: number, update: Partial<KitRecord>) { const kits = await collection<KitRecord>('kits'); if (kits) { const result = await kits.findOneAndUpdate({ id, userId, version }, { $set: update, $inc: { version: 1 } }, { returnDocument: 'after' }); return result; } const current = memory.kits.get(id); if (!current || current.userId !== userId || current.version !== version) return null; const next = { ...current, ...update, version: current.version + 1 }; memory.kits.set(id, next); return next; },
    async recordPractice(record: PracticeRecord) { const practice = await collection<PracticeRecord>('practice'); if (practice) { const existing = await practice.findOne({ userId: record.userId, kitId: record.kitId, flashcardId: record.flashcardId }); return practice.findOneAndUpdate({ userId: record.userId, kitId: record.kitId, flashcardId: record.flashcardId }, { $set: { ...record, attempts: (existing?.attempts || 0) + 1 } }, { upsert: true, returnDocument: 'after' }); } const key = `${record.userId}:${record.kitId}:${record.flashcardId}`; const next = { ...record, attempts: (memory.practice.get(key)?.attempts || 0) + 1 }; memory.practice.set(key, next); return next; },
    async listPractice(userId: string, kitId: string) { const practice = await collection<PracticeRecord>('practice'); return practice ? practice.find({ userId, kitId }).toArray() : [...memory.practice.values()].filter((item) => item.userId === userId && item.kitId === kitId); }
  };
}

export function newKitRecord(userId: string, kit: Kit): KitRecord { const now = new Date().toISOString(); return { id: new ObjectId().toHexString(), userId, kit, version: 1, status: 'ready', progress: [], createdAt: now, updatedAt: now }; }
