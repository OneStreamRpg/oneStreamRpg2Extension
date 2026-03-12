interface JoinGameScreenProps {
  status: "idle" | "joining" | "connecting";
  error?: string | null;
  onJoin?: () => void;
}

export const JoinGameScreen: React.FC<JoinGameScreenProps> = ({ status, error, onJoin }) => {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="bg-gray-900/90 border border-gray-700 p-6 flex flex-col items-center gap-4 min-w-48">
        <span className="text-white text-sm font-semibold tracking-wide">OneStream RPG</span>

        {status === "connecting" && (
          <span className="text-gray-400 text-xs">Connecting…</span>
        )}

        {(status === "idle" || status === "joining") && (
          <>
            {error && (
              <span className="text-red-400 text-xs text-center">{error}</span>
            )}
            <button
              onClick={onJoin}
              disabled={status === "joining"}
              className="pointer-events-auto bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black text-sm font-bold px-6 py-2 transition-colors w-full"
            >
              {status === "joining" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
                  Joining…
                </span>
              ) : error ? (
                "Retry"
              ) : (
                "Join Game"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
