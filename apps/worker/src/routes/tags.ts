import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  getAllTags,
  getAllLinkTagNames,
  getTagById,
  getTagByName,
  createTag,
  createTagsIfMissing,
  updateTag,
  renameTagInLinks,
  removeTagFromLinks,
  deleteTag,
} from '../db/index';
import { jsonOk, jsonError, jsonCreated } from '../utils/response';
import { generateId, now } from '../utils/id';
import type { Tag } from '@linkora/shared';

const tags = new Hono<{ Bindings: Env }>();

tags.use('*', async (c, next) => {
  const authError = requireAuth(c);
  if (authError) return authError;
  await next();
});

tags.get('/', async (c) => {
  await syncTagsFromLinks(c.env);
  const allTags = await getAllTags(c.env);
  return jsonOk(allTags);
});

async function syncTagsFromLinks(env: Env): Promise<void> {
  const names = await getAllLinkTagNames(env);
  if (names.length === 0) return;

  const ts = now();
  await createTagsIfMissing(env, names.map((name) => ({
    id: generateId(),
    name,
    color: null,
    description: null,
    created_at: ts,
    updated_at: ts,
  })));
}

function normalizeTagPayload(body: { name?: unknown; color?: unknown; description?: unknown }): {
  value?: Pick<Tag, 'name' | 'color' | 'description'>;
  error?: string;
} {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return { error: 'name is required' };
  if (name.length > 50) return { error: 'name must be 50 characters or less' };

  const color = typeof body.color === 'string' && body.color.trim()
    ? body.color.trim()
    : null;
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { error: 'color must be a hex color like #38bdf8' };
  }

  const description = typeof body.description === 'string' && body.description.trim()
    ? body.description.trim()
    : null;
  if (description && description.length > 200) {
    return { error: 'description must be 200 characters or less' };
  }

  return { value: { name, color, description } };
}

tags.post('/', async (c) => {
  let body: { name?: unknown; color?: unknown; description?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = normalizeTagPayload(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  const existing = await getTagByName(c.env, parsed.value!.name);
  if (existing) return jsonError(`Tag "${parsed.value!.name}" already exists`, 409);

  const id = generateId();
  const ts = now();
  const tag = {
    id,
    name: parsed.value!.name,
    color: parsed.value!.color,
    description: parsed.value!.description,
    created_at: ts,
    updated_at: ts,
  };
  await createTag(c.env, tag);

  return jsonCreated(tag);
});

tags.put('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await getTagById(c.env, id);
  if (!existing) return jsonError('Tag not found', 404);

  let body: { name?: unknown; color?: unknown; description?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const parsed = normalizeTagPayload(body);
  if (parsed.error) return jsonError(parsed.error, 400);

  const conflict = await getTagByName(c.env, parsed.value!.name);
  if (conflict && conflict.id !== id) return jsonError(`Tag "${parsed.value!.name}" already exists`, 409);

  const updated = {
    ...parsed.value!,
    updated_at: now(),
  };
  await updateTag(c.env, id, updated);
  await renameTagInLinks(c.env, existing.name, parsed.value!.name, updated.updated_at);

  return jsonOk({
    ...existing,
    ...updated,
  });
});

tags.delete('/:id', async (c) => {
  const existing = await getTagById(c.env, c.req.param('id'));
  if (!existing) return jsonError('Tag not found', 404);

  const ts = now();
  await removeTagFromLinks(c.env, existing.name, ts);
  await deleteTag(c.env, existing.id);
  return jsonOk({ message: 'Tag deleted' });
});

export default tags;
