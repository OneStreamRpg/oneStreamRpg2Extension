import { useEffect } from "react";
import "../utils/personalChannelDebug";

/**
 * Hook to enable debug tools in development
 * Just add this to your main component during development
 */
export function usePersonalChannelDebug(enabled = import.meta.env.DEV) {
  useEffect(() => {
    if (!enabled) return;

    console.log("🔧 Personal Channel Debug Mode Enabled");
    console.log("Use browser console commands:");
    console.log("  personalChannelDebug.logState()   - Log current state");
    console.log("  personalChannelDebug.verify()     - Verify implementation");
    console.log("  personalChannelDebug.stats()      - Action statistics");
    console.log("  personalChannelDebug.monitor()    - Monitor changes");
    console.log("  personalChannelDebug.test()       - Test optimistic updates");
    console.log("  personalChannelDebug.compare()    - Compare states");
  }, [enabled]);
}
