import { DemoConsole } from "../components/demo-console";
import { getDemoSnapshot } from "../lib/demo-store";

export default function Page() {
  return <DemoConsole initialSnapshot={getDemoSnapshot()} />;
}
