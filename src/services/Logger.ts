type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Driven by the env flag rather than hard-coded: leaving this pinned to `false`
// meant developer builds silently swallowed every diagnostic, so failures only
// ever showed up as bare browser network errors with no context.
const config: { enabled: boolean; minLevel: LogLevel } = {
    enabled: import.meta.env.VITE_DEVELOPER === "true",
    minLevel: "info",
};

function shouldLog(level: LogLevel,): boolean {
    if (!config.enabled) return false;
    if (LOG_LEVELS[level] < LOG_LEVELS[config.minLevel]) return false;
    return true;
}

function formatMessage(tag: string, message: string): string {
    const timestamp = new Date().toISOString().slice(11, 23);
    return `[${timestamp}] [${tag}] ${message}`;
}

export const logger = {
    debug(tag: string, message: string, data?: unknown) {
        if (!shouldLog("debug")) return;
        if (data !== undefined) {
            console.debug(formatMessage(tag, message), data);
        } else {
            console.debug(formatMessage(tag, message));
        }
    },

    info(tag: string, message: string, data?: unknown) {
        if (!shouldLog("info")) return;
        if (data !== undefined) {
            console.info(formatMessage(tag, message), data);
        } else {
            console.info(formatMessage(tag, message));
        }
    },

    warn(tag: string, message: string, data?: unknown) {
        if (!shouldLog("warn",)) return;
        if (data !== undefined) {
            console.warn(formatMessage(tag, message), data);
        } else {
            console.warn(formatMessage(tag, message));
        }
    },

    error(tag: string, message: string, data?: unknown) {
        if (!shouldLog("error")) return;
        if (data !== undefined) {
            console.error(formatMessage(tag, message), data);
        } else {
            console.error(formatMessage(tag, message));
        }
    },
};
