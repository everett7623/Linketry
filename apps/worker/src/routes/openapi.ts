import { Hono, type MiddlewareHandler } from 'hono';
import { requireAuth } from '../auth/index';
import { createOpenApiDocument } from '../openapi/document';
import { getRuntimeVersion } from '../config/runtime';
import type { Env } from '../types';

const routes = new Hono<{ Bindings: Env }>();

// 只挂在本文件的两个路由上：本路由器挂载在共享前缀 /api/v1 上，use('*') 会作用于整个
// /api/v1/*，拦住匿名登录请求，并让每个 API token 请求被校验两次（KNOWN_ISSUES H6）
const requireReadToken: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const authError = await requireAuth(c, 'read');
  if (authError) return authError;
  await next();
};

routes.get('/openapi.json', requireReadToken, (c) =>
  c.json(createOpenApiDocument(c.env, getRuntimeVersion(c.env)))
);

routes.get('/docs', requireReadToken, (c) => {
  const document = JSON.stringify(createOpenApiDocument(c.env, getRuntimeVersion(c.env))).replace(/</g, '\\u003c');
  return c.html(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Linketry API</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"></head>
<body><div id="swagger-ui"></div><script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({spec:${document},dom_id:'#swagger-ui',deepLinking:true,persistAuthorization:false,tryItOutEnabled:true})</script></body></html>`);
});

export default routes;
