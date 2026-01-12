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
    userId: string;
    helixToken: string;
    clientId: string;
}

export async function fetchTwitchUser({ userId, helixToken, clientId }: FetchUserParams): Promise<TwitchUser | null> {
    const response = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
        headers: {
            Authorization: `Extension ${helixToken}`,
            "Client-Id": clientId,
        },
    });

    if (!response.ok) {
        console.error("fetchTwitchUser", "Failed to fetch user data", response.status);
        return null;
    }

    const data = await response.json();
    return data.data[0] ?? null;
}
