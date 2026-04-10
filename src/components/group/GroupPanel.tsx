import { useEffect, useRef, useState } from "react";
import { usePersonalChannelActions } from "../../hooks/usePersonalChannelActions";
import { usePersonalChannelStore } from "../../store/personalChannelStore";
import { useSocketStore } from "../../store/socketStore";
import { useUIStore } from "../../store/useUIStore";
import { OutgoingGroupInvite } from "../../types/personalChannel";
import { WindowContainer } from "../ui/WindowContainer";

export const GroupPanel: React.FC = () => {
  const [inviteInput, setInviteInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track which toTwitchIds we withdrew so we don't show a "declined" toast for them
  const withdrawnIds = useRef<Set<string>>(new Set());
  const prevOutgoing = useRef<OutgoingGroupInvite[]>([]);

  const socket = useSocketStore((state) => state.socket);
  const { groupInvite, groupAccept, groupDecline, groupLeave, groupKick, groupWithdraw } =
    usePersonalChannelActions(socket);

  const displayedState = usePersonalChannelStore((state) => state.displayedState);
  const group = displayedState?.group ?? null;
  const pendingGroupInvites = displayedState?.pendingGroupInvites ?? [];
  const outgoingGroupInvites = displayedState?.outgoingGroupInvites ?? [];

  const toggleGroupPanel = useUIStore((state) => state.toggleGroupPanel);
  const groupError = useUIStore((state) => state.groupError);
  const setGroupError = useUIStore((state) => state.setGroupError);

  const me = group?.members.find((m) => m.faction === "player");
  const isLeader = me?.isLeader ?? false;
  const canInvite = !group || (isLeader && group.members.length < 5);

  // Detect entries that disappeared from outgoingGroupInvites without us withdrawing them
  useEffect(() => {
    const prev = prevOutgoing.current;
    const curr = outgoingGroupInvites;

    for (const entry of prev) {
      const stillExists = curr.some((e) => e.toTwitchId === entry.toTwitchId);
      if (!stillExists) {
        if (!withdrawnIds.current.has(entry.toTwitchId)) {
          showToast(`${entry.toUsername} declined your group invite.`);
        }
        withdrawnIds.current.delete(entry.toTwitchId);
      }
    }

    prevOutgoing.current = curr;
  }, [outgoingGroupInvites]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const handleInvite = () => {
    const name = inviteInput.trim();
    if (!name) return;
    setGroupError(null);
    groupInvite(name);
    setInviteInput("");
  };

  const handleWithdraw = (toTwitchId: string, toUsername: string) => {
    withdrawnIds.current.add(toTwitchId);
    setGroupError(null);
    groupWithdraw(toUsername);
  };

  return (
    <WindowContainer className="pointer-events-auto w-56 max-h-72 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pr-2">
        <span className="text-sm font-bold" style={{ color: "#c8a020" }}>Group</span>
        <button
          onClick={toggleGroupPanel}
          className="cursor-pointer flex items-center justify-center"
          style={{ color: "#9a7850", lineHeight: 1 }}
          title="Close"
        >
          ✕
        </button>
      </div>

      {/* Error message */}
      {groupError && (
        <div className="flex items-start justify-between gap-1 mb-2 pr-2">
          <span className="text-xs" style={{ color: "#c05050" }}>{groupError}</span>
          <button
            onClick={() => setGroupError(null)}
            className="cursor-pointer shrink-0"
            style={{ color: "#9a7850", lineHeight: 1, fontSize: 10 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Declined toast */}
      {toast && (
        <div className="mb-2 pr-2">
          <span className="text-xs" style={{ color: "#9a7850" }}>{toast}</span>
        </div>
      )}

      {/* Pending incoming invites */}
      {pendingGroupInvites.length > 0 && (
        <div className="mb-2 pr-2">
          <p className="text-xs mb-1" style={{ color: "#9a7850" }}>Pending invites</p>
          <div className="flex flex-col gap-1">
            {pendingGroupInvites.map((invite) => (
              <div key={invite.fromTwitchId} className="flex items-center gap-1">
                <span className="text-xs flex-1 truncate" style={{ color: "#f0d8a8" }}>
                  {invite.fromUsername}
                </span>
                <button
                  onClick={() => { setGroupError(null); groupAccept(invite.fromTwitchId); }}
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
                  onClick={() => { setGroupError(null); groupDecline(invite.fromTwitchId); }}
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

      {/* Invite input */}
      {canInvite && (
        <div className="flex gap-1 mb-2 pr-2">
          <input
            type="text"
            value={inviteInput}
            onChange={(e) => setInviteInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            placeholder="Username"
            className="flex-1 text-xs px-1 outline-none"
            style={{
              backgroundColor: "#120a04",
              border: "1px solid #9a7228",
              color: "#f0d8a8",
              height: 22,
            }}
          />
          <button
            onClick={handleInvite}
            className="cursor-pointer text-xs px-1.5"
            style={{
              backgroundColor: "#231206",
              border: "1px solid #9a7228",
              color: "#c8a020",
              height: 22,
            }}
          >
            Invite
          </button>
        </div>
      )}

      {/* Outgoing invites */}
      {outgoingGroupInvites.length > 0 && (
        <div className="mb-2 pr-2">
          <p className="text-xs mb-1" style={{ color: "#9a7850" }}>Sent invites</p>
          <div className="flex flex-col gap-1">
            {outgoingGroupInvites.map((invite) => (
              <div key={invite.toTwitchId} className="flex items-center gap-1">
                <span className="text-xs flex-1 truncate" style={{ color: "#9a7850" }}>
                  {invite.toUsername}
                </span>
                <button
                  onClick={() => handleWithdraw(invite.toTwitchId, invite.toUsername)}
                  className="cursor-pointer text-xs px-1"
                  style={{
                    backgroundColor: "#231206",
                    border: "1px solid #9a7228",
                    color: "#9a7850",
                    height: 18,
                  }}
                  title="Withdraw invite"
                >
                  Withdraw
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member list */}
      {group ? (
        <div className="pr-2">
          <p className="text-xs mb-1" style={{ color: "#9a7850" }}>{group.members.length}/5 members</p>
          <div className="flex flex-col gap-1 mb-2">
            {group.members.map((member) => {
              const hpPct = member.maxHp > 0 ? Math.max(0, Math.min(1, member.hp / member.maxHp)) : 0;
              const isMe = member.faction === "player";
              return (
                <div
                  key={member.twitchId}
                  className="px-1 py-0.5 rounded"
                  style={isMe ? { backgroundColor: "rgba(200,160,32,0.08)" } : undefined}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    {member.isLeader && (
                      <span style={{ color: "#c8a020", fontSize: 10 }}>★</span>
                    )}
                    <span
                      className="text-xs flex-1 truncate"
                      style={{
                        color: isMe ? "#c8a020" : "#f0d8a8",
                        fontWeight: isMe ? 700 : 400,
                      }}
                    >
                      {member.username}
                    </span>
                    {isLeader && !isMe && (
                      <button
                        onClick={() => { setGroupError(null); groupKick(member.username); }}
                        className="cursor-pointer shrink-0 text-xs"
                        style={{ color: "#9a7850" }}
                        title={`Kick ${member.username}`}
                      >
                        ✕
                      </button>
                    )}
                    <span className="text-xs shrink-0" style={{ color: "#9a7850" }}>
                      {member.hp}/{member.maxHp}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <div
                      className="h-1.5 rounded"
                      style={{ width: `${hpPct * 100}%`, backgroundColor: "#4a9c4a" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => { setGroupError(null); groupLeave(); }}
            className="cursor-pointer flex items-center gap-1 text-xs"
            style={{ color: "#9a7850" }}
          >
            <img
              src={`${import.meta.env.BASE_URL}media/img/icons/leave.png`}
              width={14}
              height={14}
              alt="Leave"
            />
            Leave Group
          </button>
        </div>
      ) : (
        pendingGroupInvites.length === 0 && outgoingGroupInvites.length === 0 && (
          <p className="text-xs pr-2" style={{ color: "#9a7850" }}>Not in a group</p>
        )
      )}
    </WindowContainer>
  );
};
