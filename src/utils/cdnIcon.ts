const CDN_BASE_URL = "https://cdn.onestreamrpg.com/images";

export function getCdnIconUrl(
  type: "items" | "enemy" | "npc" | "abilities",
  id: string
): string {
  return `${CDN_BASE_URL}/${type}/${id}.png`;
}
