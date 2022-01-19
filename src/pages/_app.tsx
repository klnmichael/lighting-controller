import type { AppProps } from "next/app";
import "@/scss/index.scss";
import { SiteStateProvider } from "@/states/use-site-state";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SiteStateProvider>
      <Component {...pageProps} />
    </SiteStateProvider>
  );
}
export default MyApp;
