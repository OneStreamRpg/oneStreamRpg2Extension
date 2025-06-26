// components/ui/TwitchAuthGate.tsx
import React, { useEffect, useState } from "react";
import { SocketProvider } from "../../context/SocketProvider";

interface Props {
  children: React.ReactNode;
}

const TwitchAuthGate: React.FC<Props> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  // const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("Development mode: skipping auth");
      setIsAuthenticated(true);
      setToken("dev-fake-jwt-token");
      setChannelId("dev-fake-channel-id");
      // setUserId("dev-fake-user-id");
      return;
    }

    if (window.Twitch && window.Twitch.ext) {
      window.Twitch.ext.onAuthorized((auth) => {
        console.log("Authorized payload:", auth);
        setToken(auth.token);
        setChannelId(auth.channelId);
        // setUserId(auth.userId);

        const isLinked = window.Twitch.ext.viewer?.isLinked;
        console.log("Twitch isLinked:", isLinked);
        setIsAuthenticated(!!isLinked);
      });
    }
  }, []);

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
    return <div>Loading...</div>;
  }

  return (
    <SocketProvider token={token} channelId={channelId}>
      {children}
    </SocketProvider>
  );
};

export default TwitchAuthGate;
