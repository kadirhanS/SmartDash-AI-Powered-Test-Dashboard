## Rate Limiter Overview

SmartDash uses a lightweight in‑memory rate limiter for its API routes. The implementation is intentionally simple to keep the repository minimal and avoid external dependencies.

### How It Works

- The limiter stores a `Map<string, {count, resetAt}>`, where the key is usually the client IP address.
- A **sliding window** of **1 minute** (`windowMs = 60_000`) and a **maximum of 30 requests** per window is the default configuration.
- Every request to a protected route calls `checkRateLimit(identifier)`.
- The function returns `{allowed, remaining, resetInMs}`:
  - `allowed`  → `true` if the request is within limits.
  - `remaining` → how many requests the client has left for the current window.
  - `resetInMs` → milliseconds until the next window.
- If the limit is exceeded, the API route should respond with **429 Too Many Requests**.

### Production Considerations

- The current in‑memory storage **resets on server restart** and is **not shared** across multiple instances. If you run SmartDash behind a load balancer or in a multi‑process environment, you should switch to a shared store such as **Redis** or **Vercel KV**.
- A very small helper wrapper around the current implementation can be added in `src/lib/rate-limit.ts` to switch implementations via an environment flag (`USE_SHARED_RATE_LIMITER`).
- The current limiter is adequate for a portfolio demo and low‑traffic testing.

### Quick‑Start Example

```ts
import { checkRateLimit } from '@/lib/rate-limit';

export const GET = async (req: Request) => {
  const ip = req.headers.get('x-forwarded-for') ?? req.ip;
  const { allowed, remaining, resetInMs } = checkRateLimit(ip ?? 'anonymous');

  if (!allowed) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(resetInMs / 1000)) },
    });
  }

  // Normal route logic here…
};
```

