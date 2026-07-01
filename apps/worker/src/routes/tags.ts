import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../auth/index';
import { getAllTags, createTag, deleteTag } from '../db/index';
import { jsonOk, jsonError, jsonCreated, parseJsonBody } from '../utils/response';
import { generateId, now } from '../utils/id';

const tags = new Hono<{ Bindings: Env }>();

tags.use('*', authMiddleware);

tags.get('/', async (c) => {
  const allTags = await getAllTags(c.env);
  return jsonOk(allTags);
});

tags.post('/', async (c) => {
  const body = await parseJsonBody<{ name?: string; color?: string; description?: string }>(c);
  if (body instanceof Response) return body;

  if (!body.name?.trim()) return jsonError('name is required', 400);

  const id = generateId();
  const ts = now();
  await createTag(c.env, {
    id,
    name: body.name.trim(),
    color: body.color ?? null,
    description: body.description ?? null,
    created_at: ts,
    updated_at: ts,
  });

  return jsonCreated({ id, name: body.name.trim(), color: body.color, description: body.description, created_at: ts, updated_at: ts });
});

tags.delete('/:id', async (c) => {
  await deleteTag(c.env, c.req.param('id'));
  return jsonOk({ message: 'Tag deleted' });
});

export default tags;
