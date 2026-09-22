import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { generateKit, regenerateCompanyBrief } from './pipeline';
import { createPersistence, newKitRecord } from './persistence';
import { allocateSchedule, validateKit, type Kit, type Category } from '@prep/kit-core';

const app = express();
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const persistence = createPersistence();
app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

type AuthUser = { id: string; email: string; passwordHash: string; createdAt: string; updatedAt: string };
async function authenticatedUser(req: express.Request) {
  const token = req.cookies.session;
  if (!token) return null;
  const session = await persistence.findSession(token);
  if (!session) return null;
  return persistence.findUserById(session.userId);
}
async function requireUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await authenticatedUser(req);
  if (!user) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } });
  res.locals.user = user as AuthUser;
  next();
}
async function setSession(res: express.Response, userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  await persistence.createSession({ token, userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) });
  res.cookie('session', token, { httpOnly: true, sameSite: process.env.COOKIE_SAMESITE === 'none' ? 'none' : 'lax', secure: process.env.COOKIE_SECURE === 'true', maxAge: 1000 * 60 * 60 * 24 * 7 });
}
function kitInput(body: unknown) {
  const value = body as Record<string, unknown>;
  return { jd: String(value.jd || ''), company_url: String(value.company_url || ''), days: Number(value.days) };
}
function errorResponse(res: express.Response, error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Request failed.';
  return res.status(status).json({ error: { code: message, message } });
}

app.get('/health', (_req, res) => res.json({ ok: true, persistence: process.env.MONGODB_URI ? 'mongodb' : 'memory-development-fallback' }));
app.post('/api/auth/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return errorResponse(res, new Error('Use a valid email and password of at least 8 characters.'));
  if (await persistence.findUserByEmail(email)) return errorResponse(res, new Error('An account already exists.'), 409);
  const now = new Date().toISOString();
  const user = { id: crypto.randomUUID(), email, passwordHash: await bcrypt.hash(password, 12), createdAt: now, updatedAt: now };
  try { await persistence.createUser(user); await setSession(res, user.id); return res.status(201).json({ user: { id: user.id, email: user.email } }); } catch { return errorResponse(res, new Error('Unable to create account.'), 409); }
});
app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await persistence.findUserByEmail(email);
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) return errorResponse(res, new Error('Email or password is incorrect.'), 401);
  await setSession(res, user.id); return res.json({ user: { id: user.id, email: user.email } });
});
app.post('/api/auth/logout', async (req, res) => { if (req.cookies.session) await persistence.deleteSession(req.cookies.session); res.clearCookie('session'); res.status(204).end(); });
app.get('/api/auth/me', requireUser, (_req, res) => res.json({ user: { id: res.locals.user.id, email: res.locals.user.email } }));

app.get('/api/kits', requireUser, async (_req, res) => res.json(await persistence.listKits(res.locals.user.id)));
app.get('/api/kits/:id', requireUser, async (req, res) => { const item = await persistence.getKit(String(req.params.id), res.locals.user.id); if (!item) return errorResponse(res, new Error('Kit not found.'), 404); return res.json(item); });
app.post('/api/kits', requireUser, async (req, res) => { try { const input = kitInput(req.body); const kit = await generateKit(input); const validation = validateKit(kit, input.days); if (!validation.success) throw validation.error; const item = await persistence.createKit(newKitRecord(res.locals.user.id, kit)); return res.status(201).json(item); } catch (error) { return errorResponse(res, error); } });
app.patch('/api/kits/:id', requireUser, async (req, res) => { try { const id = String(req.params.id); const current = await persistence.getKit(id, res.locals.user.id); if (!current) return errorResponse(res, new Error('Kit not found.'), 404); const expectedVersion = Number(req.body.expectedVersion ?? current.version); if (expectedVersion !== current.version) return errorResponse(res, new Error('Kit changed elsewhere. Reload before saving.'), 409); const validation = validateKit(req.body.kit); if (!validation.success) throw validation.error; const updated = await persistence.updateKit(id, res.locals.user.id, expectedVersion, { kit: req.body.kit, updatedAt: new Date().toISOString() }); if (!updated) return errorResponse(res, new Error('Kit changed elsewhere. Reload before saving.'), 409); return res.json(updated); } catch (error) { return errorResponse(res, error); } });
app.delete('/api/kits/:id', requireUser, async (req, res) => { const deleted = await persistence.deleteKit(String(req.params.id), res.locals.user.id); if (!deleted) return res.status(404).end(); return res.status(204).end(); });
app.post('/api/kits/:id/regenerate/company-brief', requireUser, async (req, res) => { const current = await persistence.getKit(String(req.params.id), res.locals.user.id); if (!current) return res.status(404).end(); try { const brief = await regenerateCompanyBrief(current.kit.source.company_url); const nextKit = { ...current.kit, company_brief: brief.company_brief, source: { ...current.kit.source, pages_used: brief.pages_used, researched_at: new Date().toISOString() } }; const updated = await persistence.updateKit(current.id, current.userId, current.version, { kit: nextKit, updatedAt: new Date().toISOString() }); return updated ? res.json(updated) : errorResponse(res, new Error('Kit changed elsewhere. Reload before saving.'), 409); } catch (error) { return errorResponse(res, error); } });

app.post('/api/kits/:id/regenerate/schedule', requireUser, async (req, res) => { const current = await persistence.getKit(String(req.params.id), res.locals.user.id); if (!current) return res.status(404).end(); const kit = current.kit; const nextKit = { ...kit, schedule: { days_available: kit.schedule.days_available, days: allocateSchedule(kit.role.requirements, kit.questions, kit.schedule.days_available) } }; const updated = await persistence.updateKit(current.id, current.userId, current.version, { kit: nextKit, updatedAt: new Date().toISOString() }); return updated ? res.json(updated) : errorResponse(res, new Error('Kit changed elsewhere. Reload before saving.'), 409); });
app.post('/api/kits/:id/regenerate/questions/:category', requireUser, async (req, res) => { const current = await persistence.getKit(String(req.params.id), res.locals.user.id); if (!current) return res.status(404).end(); const kit = current.kit; const category = String(req.params.category) as Category; if (!['technical', 'behavioural', 'system-design', 'company-fit'].includes(category)) return errorResponse(res, new Error('Invalid question category.'));
  const preserved = kit.questions.filter((question) => question.category !== category || question.state === 'edited' || question.state === 'pinned');
  const generated = kit.role.requirements.filter((requirement) => (requirement.kind === 'behavioural' ? category === 'behavioural' : requirement.kind === 'domain' ? category === 'company-fit' : category === 'technical')).map((requirement, index) => ({ id: `regen-${category}-${index + 1}`, requirement_ids: [requirement.id], category, prompt: `How would you demonstrate your experience with ${requirement.text}?`, answer_outline: 'Use a concrete example, explain your decisions, and connect the result to the role.', difficulty: (requirement.priority === 'must' ? 3 : 2) as 2 | 3, state: 'generated' as const }));
  const nextKit = { ...kit, questions: [...preserved, ...generated] as Kit['questions'], schedule: { days_available: kit.schedule.days_available, days: allocateSchedule(kit.role.requirements, [...preserved, ...generated], kit.schedule.days_available) } };
  const updated = await persistence.updateKit(current.id, current.userId, current.version, { kit: nextKit, updatedAt: new Date().toISOString() }); return updated ? res.json(updated) : errorResponse(res, new Error('Kit changed elsewhere. Reload before saving.'), 409);
});
app.post('/api/kits/:id/practice/:flashcardId/confidence', requireUser, async (req, res) => { const current = await persistence.getKit(String(req.params.id), res.locals.user.id); if (!current) return res.status(404).end(); const card = current.kit.flashcards.find((item) => item.id === String(req.params.flashcardId)); if (!card) return errorResponse(res, new Error('Flashcard not found.'), 404); const confidence = Number(req.body.confidence); if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) return errorResponse(res, new Error('Confidence must be an integer from 1 to 5.')); const item = await persistence.recordPractice({ userId: res.locals.user.id, kitId: current.id, flashcardId: card.id, confidence, attempts: 0, covered: true, lastPracticed: new Date().toISOString() }); return res.json(item); });
app.get('/api/kits/:id/weak-spots', requireUser, async (req, res) => { const current = await persistence.getKit(String(req.params.id), res.locals.user.id); if (!current) return res.status(404).end(); const progress = await persistence.listPractice(res.locals.user.id, current.id); const byCard = new Map(progress.map((item) => [item.flashcardId, item])); const weak = current.kit.flashcards.map((card) => ({ card, progress: byCard.get(card.id) })).sort((a, b) => (a.progress?.confidence ?? 0) - (b.progress?.confidence ?? 0)); return res.json({ total: current.kit.flashcards.length, attempted: progress.length, weak_spots: weak.slice(0, 8) }); });

app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
