import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { usePersonalChannelStore } from "../store/personalChannelStore";
import {
  ActionAcknowledgment,
  PlayerPersonalState,
  PlayerStateDelta,
} from "../types/personalChannel";

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
      console.log("📡 Subscribing to personal channel...");
      socket.emit("personalChannel:subscribe");
      hasSubscribed.current = true;
    }

    // Listen for initial state
    const handleInit = (data: { state: PlayerPersonalState; timestamp: number }) => {
      console.log("🎯 Personal state initialized", data);
      setInitialState(data.state);
      setSubscribed(true);
      syncRequested.current = false;
    };

    // Listen for delta updates
    const handleDelta = (data: { delta: PlayerStateDelta; timestamp: number }) => {
      console.log("📦 Personal state delta received", data);
      applyDelta(data.delta);
    };

    // Listen for action acknowledgments
    const handleAck = (data: ActionAcknowledgment) => {
      console.log("✉️ Action acknowledgment received", data);

      if (data.success) {
        confirmAction(data.actionId, data.delta);
      } else {
        rollbackAction(data.actionId, data.error);
      }
    };

    // Listen for sync responses
    const handleSync = (data: { state: PlayerPersonalState; timestamp: number }) => {
      console.log("🔄 Full state sync received", data);
      setInitialState(data.state);
      syncRequested.current = false;
    };

    // Listen for errors
    const handleError = (data: { error: string }) => {
      console.error("❌ Personal channel error", data);
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
      console.log("🔄 Reconnected - requesting state sync...");
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
      console.warn("❌ Disconnected from server");
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
