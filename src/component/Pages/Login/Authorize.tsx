import { useEffect } from "react";
import { useQuery } from "../../../util";
import SignIn from "./Signin/SignIn.tsx";
import { buildOAuthAuthorizePath, resolveOAuthConsent } from "./Signin/oauthConsent.ts";

const Authorize = () => {
  const query = useQuery();
  const oauthConsent = resolveOAuthConsent(query);

  useEffect(() => {
    if (!oauthConsent) {
      return;
    }

    const expectedPath = buildOAuthAuthorizePath(oauthConsent);
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (currentPath !== expectedPath) {
      window.history.replaceState({}, "", expectedPath);
    }
  }, [oauthConsent]);

  return <SignIn oauthConsent={oauthConsent} />;
};

export default Authorize;
