# Production scaling — Load balancer, Kubernetes, security

## Honest capacity note

**1 lakh (100,000) concurrent users** cannot be achieved by only adding Kubernetes. You need:

1. **CDN** (Cloudflare / Vercel Edge) for static HTML and assets  
2. **ISR caching** (implemented: `revalidate = 300` + on-demand `/api/revalidate`)  
3. **Horizontal pods** behind a load balancer (this repo’s `k8s/` manifests)  
4. **Neon scale** (compute autoscaling, read replicas)  
5. **Redis** for distributed rate limiting (optional; ingress limits help)  

With all of the above, realistic targets are **5,000–15,000 concurrent** on a mid-size cluster; **100k** requires enterprise CDN + multi-region + dedicated SRE.

---

## What was added in code

| Change | Purpose |
|--------|---------|
| `middleware.ts` | API rate limiting (120 req/min/IP default) |
| `lib/sanitizeCmsHtml.ts` | XSS protection on WP HTML |
| `lib/siteUrl.ts` | One canonical domain for SEO |
| Security headers in `next.config.js` | CSP, HSTS, Permissions-Policy |
| `revalidate = 300` on pages/blog | ISR — fewer DB hits per request |
| Timing-safe sync token compare | Backend security |
| `k8s/` + `docker/` | Self-hosted scale path |

---

## Path A — Stay on Vercel (fastest)

1. Set env on Vercel:
   - `NEXT_PUBLIC_SITE_URL=https://argroupofeducation.com`
   - `CONTENT_SOURCE=api`
   - `PAYLOAD_CMS_ENABLED=false`
   - Strong `PAYLOAD_SYNC_SECRET`, `REVALIDATE_SECRET`
2. Enable **Vercel Firewall** / Pro plan rate limits  
3. Put **Cloudflare** in front (WAF, cache, DDoS)  
4. Finish WP import → Neon (`npm run wp:import:payload:pages`)  

Vercel already load-balances serverless instances globally.

---

## Path B — Kubernetes + NGINX load balancer

### Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)  
- `kubectl`, `docker`  
- NGINX Ingress Controller  
- Neon `DATABASE_URL` in secrets  

### Build images

```bash
docker build -f docker/frontend.Dockerfile -t ar-education/frontend:latest .
docker build -f docker/backend.Dockerfile -t ar-education/backend:latest .
# push to your registry (ECR, GCR, Docker Hub)
```

### Deploy

```bash
kubectl apply -f k8s/namespace.yaml
# Edit k8s/configmap.example.yaml with real secrets → save as k8s/secrets.local.yaml (gitignored)
kubectl apply -f k8s/configmap.example.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa-frontend.yaml
```

**Load balancing:** Ingress distributes traffic across **5–40 frontend pods** (HPA). That is your Layer-7 load balancer.

### Scale checklist

- [ ] 5+ frontend replicas minimum  
- [ ] HPA maxReplicas tuned after load test  
- [ ] Neon autoscaling enabled  
- [ ] Redis for rate limit (if >10 pods)  
- [ ] CDN in front of ingress  
- [ ] Complete page import to Neon  

---

## Security checklist

- [ ] `ALLOW_PUBLIC_DRAFT_PREVIEW=false` on Payload  
- [ ] Disable Payload GraphQL playground in production  
- [ ] Rotate `PAYLOAD_SYNC_SECRET` / `REVALIDATE_SECRET`  
- [ ] Cloudflare WAF + bot fight mode  
- [ ] MFA on Payload admin users  

---

## Load test (before claiming scale)

```bash
# Example with k6 — run against staging, not production homepage during peak
k6 run --vus 500 --duration 5m load-test.js
```

Monitor: Neon CPU, pod CPU, P95 latency, 429 rate from middleware.
