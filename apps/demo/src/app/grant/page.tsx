import { cookies } from "next/headers";

import { GrantDemoConsole } from "../../components/grant-demo-console";
import { getDemoSnapshot } from "../../lib/demo-store";
import { createDemoStoreFromCookieValue, demoStateCookieName } from "../../lib/demo-session";

export default async function GrantPage() {
  const cookieStore = await cookies();
  const store = createDemoStoreFromCookieValue(cookieStore.get(demoStateCookieName)?.value);

  return <GrantDemoConsole initialSnapshot={getDemoSnapshot("player_ada", store)} />;
}
