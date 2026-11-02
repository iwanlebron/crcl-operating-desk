import { createFileRoute } from "@tanstack/react-router";
import { Desk } from "@/components/desk";
import { getSnapshot } from "@/lib/crcl.functions";

export const Route = createFileRoute("/")({
  loader: () => getSnapshot(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  return <Desk initial={data} />;
}
