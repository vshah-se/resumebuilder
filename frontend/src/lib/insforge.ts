import { createClient } from '@insforge/sdk';

// Server-side client (for API routes - uses non-prefixed env vars)
export function createServerClient() {
  return createClient({
    baseUrl: process.env.INSFORGE_BASE_URL!,
    anonKey: process.env.INSFORGE_ANON_KEY!,
  });
}

// Client-side client (for React components - uses NEXT_PUBLIC_ env vars)
const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_BASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

export default insforge;
