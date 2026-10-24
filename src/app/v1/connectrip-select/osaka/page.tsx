import { getConnectripSelectOsakaViewModel } from "@/website-v1/content/select/osaka";
import { toMetadata } from "@/website-v1/metadata";
import { ConnectripSelectView } from "@/website-v1/views/ConnectripSelectView";

export function generateMetadata() {
  return toMetadata(getConnectripSelectOsakaViewModel().seo);
}

export default function V1ConnectripSelectOsakaPage() {
  return <ConnectripSelectView vm={getConnectripSelectOsakaViewModel()} />;
}
