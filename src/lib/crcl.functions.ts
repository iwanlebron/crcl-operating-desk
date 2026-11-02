import { createServerFn } from "@tanstack/react-start";
import type { Snapshot } from "./crcl.server";

export const getSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<Snapshot> => {
  const { loadSnapshot } = await import("./crcl.server");
  return loadSnapshot();
});
