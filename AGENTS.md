<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Critical Differences (Next.js 16)

| Feature | Old Way (DO NOT USE) | New Way (USE THIS) |
|---------|---------------------|-------------------|
| **Route Handlers** | `NextApiRequest` / `NextApiResponse` | Web API `Request` / `Response` |
| **Dynamic params** | `params` directly | `params` is a **Promise** (must await) |
| **FormData** | `req.body` | `request.formData()` |
| **Body parser** | Manual config | Not needed (auto) |
| **Metadata** | `Head` component | `generateMetadata` or `metadata` export |
| **CSS** | `tailwind.config.js` | CSS-first (`@theme inline` in globals.css) |
<!-- END:nextjs-agent-rules -->
