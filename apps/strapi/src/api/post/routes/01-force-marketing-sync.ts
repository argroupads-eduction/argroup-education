/**
 * Force one published post into marketing MySQL (HTTP + DB fallback).
 * Auth: Bearer PAYLOAD_SYNC_SECRET (same as www).
 *
 * POST /api/posts/force-marketing-sync
 * Body: { "slug": "best-md-ms-colleges-in-uttar-pradesh" }
 */
export default {
  routes: [
    {
      method: 'POST',
      // Full API path becomes /api/posts/actions/force-marketing-sync
      path: '/posts/actions/force-marketing-sync',
      handler: 'post.forceMarketingSync',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
