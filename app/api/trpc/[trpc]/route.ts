import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createTRPCRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: createTRPCRouter(),
    createContext: createTRPCContext
  });

export { handler as GET, handler as POST };
