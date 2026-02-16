import React, { useEffect } from "react";
import { useAuthStore } from "../../hooks/useAuthStore";
import { logger } from "../../services/Logger";
import { fetchTwitchUser } from "../../services/TwitchService";

const TAG = "TwitchAuthGate";

type Props = {
  children: React.ReactNode;
};

export const TwitchAuthGate: React.FC<Props> = ({ children }) => {
  const {
    isAuthenticated,
    setAuth,
    setLoggedOut,
    setProfile,
    token,
    channelId,
  } = useAuthStore();

  useEffect(() => {
    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onAuthorized(async (auth) => {
        logger.info(TAG, `onAuthorized: auth=`, auth);
        const isLinked = !!window.Twitch.ext.viewer?.isLinked;

        const user = await fetchTwitchUser({
          userId: auth.channelId,
          helixToken: auth.helixToken,
          clientId: auth.clientId,
        });

        if (user) {
          setProfile(user);
        }

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
  }, [setAuth, setLoggedOut, setProfile]);

  const handleShare = () => {
    logger.info(TAG, "User requesting ID share");
    window.Twitch?.ext?.actions?.requestIdShare();
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

  return children;
};
