const CDN_BASE_URL = "http://cdn.onestreamrpg.com";

export function getCdnIconUrl(
  type: "items" | "enemy" | "npc",
  id: string
): string {
  return `${CDN_BASE_URL}/${type}/${id}.png`;
}
