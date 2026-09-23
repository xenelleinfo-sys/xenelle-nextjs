/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only"; // <-- ensure this file cannot be imported from the client
import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { connection } from "next/server";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});
// If your router is on a separate server, pass a client:
// createTRPCOptionsProxy({
//   client: createTRPCClient({
//     links: [httpLink({ url: '...' })],
//   }),
//   queryClient: getQueryClient,
// });

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

/**
 * Prefetch a tRPC query on the server so the client component's
 * useSuspenseQuery finds it in the hydrated cache. Always `await` it.
 *
 * `connection()` marks the render as request-time: TanStack Query uses
 * Date.now() internally, which Cache Components forbids in the static shell.
 * The DB is still not hit per request - catalog procedures read from the
 * `"use cache"` layer (server/catalog.ts) until an admin write invalidates it.
 * Call it inside a <Suspense> boundary.
 */
export async function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  await connection();
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    return queryClient.prefetchInfiniteQuery(queryOptions as any);
  }
  return queryClient.prefetchQuery(queryOptions);
}
