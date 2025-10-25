import React, { useEffect } from "react";
import { useAuthStore } from "../../hooks/useAuthStore";

type Props = {
  children: React.ReactNode;
}

export const TwitchAuthGate: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, setAuth, setLoggedOut, token, channelId } = useAuthStore();

  useEffect(() => {
    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onAuthorized((auth) => {
        console.log(TwitchAuthGate.name, "onAuthorized", { auth });
        const isLinked = !!window.Twitch.ext.viewer?.isLinked;

        setAuth({
          token: auth.token,
          channelId: auth.channelId,
          isLinked: isLinked,
        });
      });

      window.Twitch.ext.onContext(() => {
        const isNowLinked = !!window.Twitch.ext.viewer?.isLinked;
        if (!isNowLinked) {
          setLoggedOut();
        }
      });
    }
  }, [setAuth, setLoggedOut]);


  const handleShare = () => {
    console.log("Requesting ID share...");
    window.Twitch?.ext?.actions?.requestIdShare();
    // No need for anything else — Twitch will re-trigger onAuthorized
  };

  if (isAuthenticated === false) {
    return (
      <div id="loggedOut">
        <p>You need to share your Twitch ID to continue</p>
        <button id="share" onClick={handleShare}>
          Share ID
        </button>
      </div>
    );
  }

  if (isAuthenticated === null || !token || !channelId) {
    return <div>Authentication in progress...</div>;
  }

  return children
};

