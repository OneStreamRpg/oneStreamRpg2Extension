import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { logger } from "../services/Logger";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import {
  ActionAcknowledgment,
  PlayerPersonalState,
  PlayerStateDelta,
} from "../types/personalChannel";

const TAG = "PersonalChannel";

interface UsePersonalChannelOptions {
  socket: Socket | null;
  isConnected: boolean;
  enabled?: boolean;
}

export function usePersonalChannel(options: UsePersonalChannelOptions) {
  const { socket, isConnected, enabled = true } = options;
  const hasSubscribed = useRef(false);
  const syncRequested = useRef(false);

  const {
    isSubscribed,
    isReady,
    setSubscribed,
    setInitialState,
    applyDelta,
    confirmAction,
    rollbackAction,
    rollbackAllActions,
    setError,
    resetState,
  } = usePersonalChannelStore();

  // Subscribe to personal channel on connection
  useEffect(() => {
    if (!socket || !isConnected || !enabled) {
      return;
    }

    // Subscribe only once
    if (!hasSubscribed.current) {
      logger.info(TAG, "Subscribing to personal channel");
      socket.emit("personalChannel:subscribe");
      hasSubscribed.current = true;
    }

    // Listen for initial state
    const handleInit = (data: { state: PlayerPersonalState; timestamp: number }) => {
      logger.info(TAG, "Initial state received from server", { data });
      setInitialState(data.state);
      setSubscribed(true);
      syncRequested.current = false;
    };

    // Listen for delta updates
    const handleDelta = (data: { delta: PlayerStateDelta; timestamp: number }) => {
      logger.debug(TAG, "Delta update received", { data });
      applyDelta(data.delta);
    };

    // Listen for action acknowledgments
    const handleAck = (data: ActionAcknowledgment) => {
      logger.debug(TAG, `Action acknowledgment received: actionId=${data.actionId}, success=${data.success}`, data);

      if (data.success) {
        confirmAction(data.actionId, data.delta);
      } else {
        rollbackAction(data.actionId, data.error);
      }
    };

    // Listen for sync responses
    const handleSync = (data: { state: PlayerPersonalState; timestamp: number }) => {
      logger.info(TAG, "Full state sync received from server", { data });
      setInitialState(data.state);
      syncRequested.current = false;
    };

    // Listen for errors
    const handleError = (data: { error: string }) => {
      logger.error(TAG, `Channel error: ${data.error}`, data);
      setError(data.error);
    };

    // Register event listeners
    socket.on("personalState:init", handleInit);
    socket.on("personalState:delta", handleDelta);
    socket.on("personalState:ack", handleAck);
    socket.on("personalState:sync", handleSync);
    socket.on("personalState:error", handleError);

    // Cleanup
    return () => {
      socket.off("personalState:init", handleInit);
      socket.off("personalState:delta", handleDelta);
      socket.off("personalState:ack", handleAck);
      socket.off("personalState:sync", handleSync);
      socket.off("personalState:error", handleError);
    };
  }, [
    socket,
    isConnected,
    enabled,
    setSubscribed,
    setInitialState,
    applyDelta,
    confirmAction,
    rollbackAction,
    setError,
  ]);

  // Handle reconnection
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleReconnect = () => {
      logger.info(TAG, "Reconnected to server, requesting state sync");
      hasSubscribed.current = false;
      rollbackAllActions();
      resetState();

      // Wait a bit for authentication, then subscribe
      setTimeout(() => {
        if (socket.connected && !syncRequested.current) {
          socket.emit("personalChannel:subscribe");
          hasSubscribed.current = true;
          syncRequested.current = true;
        }
      }, 100);
    };

    const handleDisconnect = () => {
      logger.warn(TAG, "Disconnected from server");
      setSubscribed(false);
      hasSubscribed.current = false;
    };

    socket.on("connect", handleReconnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleReconnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, enabled, rollbackAllActions, resetState, setSubscribed]);

  return {
    isSubscribed,
    isReady,
  };
}
