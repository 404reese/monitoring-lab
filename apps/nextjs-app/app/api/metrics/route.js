import { metrics } from "../../../lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(await metrics.register.metrics(), {
    headers: { "Content-Type": metrics.register.contentType },
  });
}
