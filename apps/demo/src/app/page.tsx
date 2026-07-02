import { cookies } from "next/headers";

import { DemoConsole } from "../components/demo-console";
import { getDemoSnapshot } from "../lib/demo-store";
import { createDemoStoreFromCookieValue, demoStateCookieName } from "../lib/demo-session";

export default async function Page() {
  const cookieStore = await cookies();
  const store = createDemoStoreFromCookieValue(cookieStore.get(demoStateCookieName)?.value);

  return <DemoConsole initialSnapshot={getDemoSnapshot("player_ada", store)} />;
}
