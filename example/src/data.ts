export interface FeedItem {
  id: string;
  uri: string;
  title: string;
}

/** Deterministic variety of aspect ratios via picsum seeds. */
export const FEED_ITEMS: FeedItem[] = Array.from({ length: 30 }, (_, i) => {
  const dimensions = [
    [800, 600],
    [600, 800],
    [900, 300],
    [500, 500],
    [700, 1000],
    [1200, 400],
  ][i % 6] as [number, number];
  return {
    id: `item-${i}`,
    uri: `https://picsum.photos/seed/fastimage-${i}/${dimensions[0]}/${dimensions[1]}`,
    title: `Photo #${i + 1} (${dimensions[0]}x${dimensions[1]})`,
  };
});
