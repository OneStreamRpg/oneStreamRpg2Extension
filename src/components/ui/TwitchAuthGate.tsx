import React, { useEffect, useRef } from "react";
import { useAuthStore } from "../../hooks/useAuthStore";
import { logger } from "../../services/Logger";
import { fetchTwitchUser, isSharedUserId } from "../../services/TwitchService";
import { WindowContainer } from "./WindowContainer";

const TAG = "TwitchAuthGate";

type Props = {
  children: React.ReactNode;
};

/**
 * The gate can render over the stream video, where the default black-on-
 * transparent text is effectively invisible. Everything it shows sits in the
 * game's window frame so it reads against any background.
 *
 * Centred over the whole viewport: this is the only thing on screen at this
 * point, and the overlay is otherwise click-through, so the wrapper stays
 * pointer-events-none and lets WindowContainer re-enable it for the frame.
 */
const GateMessage: React.FC<{ id?: string; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <div
    id={id}
    className="fixed inset-0 flex items-center justify-center p-2 pointer-events-none"
  >
    <WindowContainer style={{ paddingRight: "8px" }}>
      <div className="flex flex-col items-center gap-2 text-xs text-center">
        {children}
      </div>
    </WindowContainer>
  </div>
);

export const TwitchAuthGate: React.FC<Props> = ({ children }) => {
  const {
    isAuthenticated,
    setAuth,
    setLinked,
    setLoggedOut,
    setProfile,
    token,
    channelId,
  } = useAuthStore();

  // onAuthorized carries the Helix credentials; viewer.onChanged carries the
  // identity. They fire independently, so the last credentials are kept here
  // for whichever callback ends up being the one that can complete the lookup.
  const helixCredentials = useRef<{
    helixToken: string;
    clientId: string;
  } | null>(null);
  // Guards against refetching the same profile every time Twitch refreshes the
  // token (hourly) or replays viewer.onChanged.
  const fetchedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (window.Twitch && window.Twitch.ext) {
      const loadProfile = async (reason: string) => {
        const credentials = helixCredentials.current;
        // viewer.id is the numeric ID once shared; auth.userId is opaque until
        // then. Prefer viewer.id — it's the value that actually updates when
        // the viewer accepts the prompt.
        const userId = window.Twitch.ext.viewer?.id ?? undefined;

        if (!credentials) return;
        if (!isSharedUserId(userId)) {
          logger.info(TAG, `Identity not shared yet, skipping profile fetch (${reason})`);
          return;
        }
        if (fetchedUserId.current === userId) return;
        fetchedUserId.current = userId;

        // auth.userId is the *viewer*, auth.channelId is the broadcaster.
        // Looking up the channel here made every viewer see the streamer's
        // avatar and login in their own profile widget.
        const user = await fetchTwitchUser({ userId, ...credentials });

        if (user) {
          logger.info(TAG, `Twitch user fetched: ${user.display_name} (${reason})`);
          setProfile(user);
        } else {
          // Let a later onChanged/onAuthorized retry rather than caching failure.
          fetchedUserId.current = null;
          logger.warn(TAG, `Failed to fetch Twitch user profile (${reason})`);
        }
      };

      window.Twitch.ext.onAuthorized(async (auth) => {
        logger.info(TAG, "onAuthorized", { channelId: auth.channelId });
        const isLinked = !!window.Twitch.ext.viewer?.isLinked;

        helixCredentials.current = {
          helixToken: auth.helixToken,
          clientId: auth.clientId,
        };

        setAuth({
          token: auth.token,
          channelId: auth.channelId,
          isLinked: isLinked,
        });

        await loadProfile("onAuthorized");
      });

      // Accepting the share prompt updates the viewer without necessarily
      // re-firing onAuthorized — without this the avatar stayed a placeholder
      // until the viewer reloaded the extension.
      window.Twitch.ext.viewer?.onChanged(() => {
        const isLinked = !!window.Twitch.ext.viewer?.isLinked;
        logger.info(TAG, "viewer.onChanged", { isLinked });
        setLinked(isLinked);
        void loadProfile("viewer.onChanged");
      });

      window.Twitch.ext.onContext(() => {
        const isNowLinked = !!window.Twitch.ext.viewer?.isLinked;
        if (!isNowLinked) {
          logger.info(TAG, "User unlinked, logging out");
          setLoggedOut();
        }
      });
    }
  }, [setAuth, setLinked, setLoggedOut, setProfile]);

  const handleShare = () => {
    logger.info(TAG, "User requesting ID share");
    window.Twitch?.ext?.actions?.requestIdShare();
  };

  if (isAuthenticated === false) {
    return (
      <GateMessage id="loggedOut">
        <p>Share your Twitch ID to play</p>
        <button
          id="share"
          onClick={handleShare}
          className="cursor-pointer"
          style={{
            color: "#f0d060",
            background: "rgba(0,0,0,0.7)",
            border: "3px solid #9a7228",
            borderBottomColor: "#3d1a06",
            borderRightColor: "#3d1a06",
            padding: "6px 14px",
            fontSize: "13px",
            lineHeight: 1,
          }}
        >
          Share ID
        </button>
      </GateMessage>
    );
  }

  if (isAuthenticated === null || !token || !channelId) {
    return <GateMessage>Authentication in progress...</GateMessage>;
  }

  return children;
};
