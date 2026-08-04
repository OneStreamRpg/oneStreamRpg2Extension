import { logger } from "./Logger";

const TAG = "TwitchService";

export type TwitchUser = {
    id: string;
    login: string;
    display_name: string;
    type: "" | "admin" | "global_mod" | "staff";
    broadcaster_type: "" | "affiliate" | "partner";
    description: string;
    profile_image_url: string;
    offline_image_url: string;
    view_count: number;
    created_at: string;
}

type FetchUserParams = {
    /** Numeric Twitch user ID. Undefined/opaque until the viewer shares their ID. */
    userId: string | undefined;
    helixToken: string;
    clientId: string;
}

/**
 * Helix only accepts numeric Twitch user IDs. Until the viewer shares their
 * identity we get an opaque ID instead ("U..." unlinked, "A..." anonymous),
 * which Helix rejects with 400 Bad Identifiers.
 */
export function isSharedUserId(userId: string | undefined): userId is string {
    return !!userId && /^\d+$/.test(userId);
}

export async function fetchTwitchUser({ userId, helixToken, clientId }: FetchUserParams): Promise<TwitchUser | null> {
    if (!isSharedUserId(userId)) {
        logger.info(TAG, `Skipping user fetch: identity not shared (userId=${userId})`);
        return null;
    }

    let response: Response;
    try {
        response = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
            headers: {
                Authorization: `Extension ${helixToken}`,
                "Client-Id": clientId,
            },
        });
    } catch (err) {
        // Network-level failure (CSP block, offline, DNS) never reaches the
        // status check below, and used to surface as a bare unhandled rejection.
        logger.error(TAG, `User fetch threw for userId=${userId}`, err);
        return null;
    }

    if (!response.ok) {
        // Helix explains itself in the body — status alone can't tell an
        // expired token from a malformed ID from a client-id mismatch.
        const body = await response.text().catch(() => "<unreadable>");
        logger.error(
            TAG,
            `Failed to fetch user data: status=${response.status}, userId=${userId}, body=${body}`
        );
        return null;
    }

    const data = await response.json();
    const user = data.data?.[0] ?? null;
    if (user) {
        logger.info(TAG, `Fetched Twitch user: ${user.display_name}`);
    } else {
        logger.warn(TAG, `No user data returned for userId=${userId}`);
    }
    return user;
}
