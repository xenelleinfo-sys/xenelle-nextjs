import { connection } from "next/server";
import { buildLlmsTxt } from "@/server/llms";

export async function GET() {
  await connection();
  return new Response(await buildLlmsTxt({ full: false }), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
