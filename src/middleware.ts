import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth';
import { getDb } from './lib/db';
import { getTenantBySlug, getTenantById } from './lib/tenant';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, locals, redirect, request } = context;
  
  // Initialize locals
  locals.session = getSession(context);
  
  try {
    locals.db = getDb(context.locals.runtime);
  } catch (e) {
    console.error('DB Init Error:', e);
  }

  const path = url.pathname;

  // Skip auth for login and public assets
  if (path === '/login' || path.startsWith('/api/auth') || path.startsWith('/_astro')) {
    return next();
  }

  // Auth check
  if (!locals.session) {
    return redirect('/login');
  }

  // --- TENANT RESOLUTION LOGIC ---
  
  // 1. Resolve from URL Path Segment (e.g. /[slug]/...)
  const match = path.match(/^\/([^/]+)/);
  if (match) {
    const slug = match[1];
    
    // If it's a global path, we don't force a tenant context from the URL
    if (!['super-admin', 'api', 'logout'].includes(slug)) {
      const tenant = await getTenantBySlug(locals.db, slug);
      if (tenant) {
        locals.tenant = tenant;
      } else {
        return new Response('Tenant Not Found', { status: 404 });
      }
    }
  }

  // 2. Resolve from Referer (for AJAX/API calls from a tenant's page)
  if (!locals.tenant && path.startsWith('/api/')) {
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        const refUrl = new URL(referer);
        const refMatch = refUrl.pathname.match(/^\/([^/]+)/);
        if (refMatch) {
          const refSlug = refMatch[1];
          if (!['super-admin', 'api', 'logout'].includes(refSlug)) {
             const tenant = await getTenantBySlug(locals.db, refSlug);
             if (tenant) locals.tenant = tenant;
          }
        }
      } catch (e) { /* ignore invalid referer */ }
    }
  }

  // 3. Resolve from Session (fallback for restricted users)
  if (!locals.tenant && locals.session.tenantId) {
    const tenant = await getTenantById(locals.db, locals.session.tenantId);
    if (tenant) locals.tenant = tenant;
  }

  // --- RBAC & ACCESS CONTROL ---

  // Global Admin Access
  if (path.startsWith('/super-admin') && locals.session.role !== 'super_admin') {
    return redirect('/login');
  }

  // Cross-tenant Protection
  // If we have a tenant context (either from URL, Referer, or session fallback),
  // ensured the logged-in user is allowed to access it.
  if (locals.tenant && locals.session.role !== 'super_admin' && locals.session.tenantId !== locals.tenant.id) {
    return new Response('Forbidden: Cross-tenant access denied', { status: 403 });
  }

  return next();
});
