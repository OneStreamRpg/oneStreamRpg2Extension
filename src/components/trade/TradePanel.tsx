import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { useUIStore } from "../../store/useUIStore";
import { WindowContainer } from "../ui/WindowContainer";

export const TradePanel: React.FC = () => {
  const socket = useSocketStore((state) => state.socket);
  const { tradeRequest, tradeRespond, tradeWithdraw } = usePersonalChannelActions(socket);

  const displayedState = usePersonalChannelStore((state) => state.displayedState);
  const nearbyPlayers = displayedState?.nearbyPlayers ?? [];
  const pendingTradeInvites = displayedState?.pendingTradeInvites ?? [];
  const outgoingTradeInvites = displayedState?.outgoingTradeInvites ?? [];
  const tradeSession = displayedState?.tradeSession ?? null;

  const toggleTradePanel = useUIStore((state) => state.toggleTradePanel);
  const tradeError = useUIStore((state) => state.tradeError);
  const setTradeError = useUIStore((state) => state.setTradeError);

  // Don't show invite UI while a trade is already in progress — the
  // TradeWindow takes over.
  const inTrade = tradeSession !== null;

  const outgoingIds = new Set(outgoingTradeInvites.map((i) => i.toTwitchId));

  return (
    <WindowContainer className="pointer-events-auto w-56 max-h-72 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pr-2">
        <span className="text-sm font-bold" style={{ color: "#c8a020" }}>Trade</span>
        <button
          onClick={toggleTradePanel}
          className="cursor-pointer flex items-center justify-center"
          style={{ color: "#9a7850", lineHeight: 1 }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Error message */}
      {tradeError && (
        <div className="flex items-start justify-between gap-1 mb-2 pr-2">
          <span className="text-xs" style={{ color: "#c05050" }}>{tradeError}</span>
          <button
            onClick={() => setTradeError(null)}
            className="cursor-pointer shrink-0"
            style={{ color: "#9a7850", lineHeight: 1, fontSize: 10 }}
          >
            ✕
          </button>
        </div>
      )}

      {inTrade ? (
        <p className="text-xs pr-2" style={{ color: "#9a7850" }}>
          Trading with {tradeSession?.partner.username}…
        </p>
      ) : (
        <>
          {/* Pending incoming invites */}
          {pendingTradeInvites.length > 0 && (
            <div className="mb-2 pr-2">
              <p className="text-xs mb-1" style={{ color: "#9a7850" }}>Trade requests</p>
              <div className="flex flex-col gap-1">
                {pendingTradeInvites.map((invite) => (
                  <div key={invite.fromTwitchId} className="flex items-center gap-1">
                    <span className="text-xs flex-1 truncate" style={{ color: "#f0d8a8" }}>
                      {invite.fromUsername}
                    </span>
                    <button
                      onClick={() => { setTradeError(null); tradeRespond(invite.fromTwitchId, true); }}
                      className="cursor-pointer shrink-0"
                      title="Accept"
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}media/img/icons/accept.png`}
                        width={16}
                        height={16}
                        alt="Accept"
                      />
                    </button>
                    <button
                      onClick={() => { setTradeError(null); tradeRespond(invite.fromTwitchId, false); }}
                      className="cursor-pointer shrink-0"
                      title="Decline"
                    >
                      <img
                        src={`${import.meta.env.BASE_URL}media/img/icons/decline.png`}
                        width={16}
                        height={16}
                        alt="Decline"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby players */}
          <div className="pr-2">
            <p className="text-xs mb-1" style={{ color: "#9a7850" }}>Nearby players</p>
            {nearbyPlayers.length === 0 ? (
              <p className="text-xs" style={{ color: "#9a7850" }}>No one nearby to trade with.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {nearbyPlayers.map((player) => {
                  const invited = outgoingIds.has(player.twitchId);
                  return (
                    <div key={player.twitchId} className="flex items-center gap-1">
                      <span className="text-xs flex-1 truncate" style={{ color: "#f0d8a8" }}>
                        {player.username}
                      </span>
                      {invited ? (
                        <span className="text-xs shrink-0" style={{ color: "#9a7850" }}>
                          Invited…
                        </span>
                      ) : (
                        <button
                          onClick={() => { setTradeError(null); tradeRequest(player.twitchId); }}
                          className="cursor-pointer text-xs px-1.5"
                          style={{
                            backgroundColor: "#231206",
                            border: "1px solid #9a7228",
                            color: "#c8a020",
                            height: 20,
                          }}
                          title={`Invite ${player.username} to trade`}
                        >
                          Invite
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outgoing invites — listed separately so they can be cancelled even
              after the invitee has walked out of range. */}
          {outgoingTradeInvites.length > 0 && (
            <div className="mt-2 pr-2">
              <p className="text-xs mb-1" style={{ color: "#9a7850" }}>Sent invites</p>
              <div className="flex flex-col gap-1">
                {outgoingTradeInvites.map((invite) => (
                  <div key={invite.toTwitchId} className="flex items-center gap-1">
                    <span className="text-xs flex-1 truncate" style={{ color: "#9a7850" }}>
                      {invite.toUsername}
                    </span>
                    <button
                      onClick={() => { setTradeError(null); tradeWithdraw(invite.toTwitchId); }}
                      className="cursor-pointer text-xs px-1"
                      style={{
                        backgroundColor: "#231206",
                        border: "1px solid #9a7228",
                        color: "#9a7850",
                        height: 18,
                      }}
                      title="Cancel invite"
                    >
                      Cancel invite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </WindowContainer>
  );
};
