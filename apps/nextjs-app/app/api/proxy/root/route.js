import { proxyTo } from "../../../../lib/proxy";

export const dynamic = "force-dynamic";
export const GET = proxyTo("/api/proxy/root", "/");
