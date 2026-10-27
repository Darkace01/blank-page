// Justified-rows collage: photos sit in rows that share a height, each keeping
// its own aspect ratio, and every row is scaled to span the full width. Photos
// are chosen by aspect ratio so each row lands close to its target height:
// while a row has lots of room any photo will do, but as it fills up the photo
// whose shape best fits the remaining space is picked.

const GAP_RATIO = 0.015; // gap between tiles, as a share of the shorter side
const OPEN_ROW = 1.6; // room left (in aspect-ratio units) where any photo fits
const CLOSE_ENOUGH = 0.3; // stop filling a row once this little room is left
const SAMPLE_SIZE = 12; // candidates considered when fitting a row
const MAX_ROW_STRETCH = 1.5; // cap on a short last row growing taller
const MAX_PER_ROW = 5; // keeps the number of downloads per change sensible

const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const closestIndex = (candidates, aspectRatio) => {
  let best = 0;
  for (let i = 1; i < candidates.length; i++) {
    if (
      Math.abs(candidates[i].aspectRatio - aspectRatio) <
      Math.abs(candidates[best].aspectRatio - aspectRatio)
    ) {
      best = i;
    }
  }
  return best;
};

// `pool` items need `width` and `height`. Returns tiles with `left`, `top`,
// `width` and `height` as percentages of the box, plus `pxWidth`/`pxHeight`.
export const buildCollage = (pool, boxWidth, boxHeight) => {
  const landscape = boxWidth >= boxHeight;
  // Small pools (e.g. a local folder with a couple of photos) get fewer rows,
  // so the photos they have are shown large rather than leaving rows empty.
  const rowCount = Math.min(
    (landscape ? 2 : 3) + Math.floor(Math.random() * 2),
    Math.max(1, pool.length),
  );
  const gap = Math.min(boxWidth, boxHeight) * GAP_RATIO;
  const targetHeight = (boxHeight - gap * (rowCount - 1)) / rowCount;

  const remaining = shuffle(pool).map((picture) => ({
    picture,
    aspectRatio: picture.width / picture.height,
  }));

  const rows = [];
  while (rows.length < rowCount && remaining.length) {
    const row = [];
    let ratioSum = 0;
    while (remaining.length) {
      // Width available if one more photo joins the row (one more gap).
      const targetRatio = (boxWidth - gap * row.length) / targetHeight;
      const room = targetRatio - ratioSum;
      if (row.length && room < CLOSE_ENOUGH) break;

      const sample = remaining.slice(0, SAMPLE_SIZE);
      const index = room > OPEN_ROW ? 0 : closestIndex(sample, room);
      const [item] = remaining.splice(index, 1);
      row.push(item);
      ratioSum += item.aspectRatio;
      if (ratioSum >= targetRatio || row.length >= MAX_PER_ROW) break;
    }
    const height = Math.min(
      (boxWidth - gap * (row.length - 1)) / ratioSum,
      targetHeight * MAX_ROW_STRETCH,
    );
    rows.push({ items: row, height });
  }

  // Shrink everything to fit if the rows came out too tall, then centre.
  const totalHeight =
    rows.reduce((sum, row) => sum + row.height, 0) + gap * (rows.length - 1);
  const scale = Math.min(1, boxHeight / totalHeight);
  const scaledGap = gap * scale;

  const tiles = [];
  let y = (boxHeight - totalHeight * scale) / 2;
  for (const row of rows) {
    const height = row.height * scale;
    const rowWidth =
      row.items.reduce((sum, item) => sum + item.aspectRatio * height, 0) +
      scaledGap * (row.items.length - 1);
    let x = (boxWidth - rowWidth) / 2;
    for (const item of row.items) {
      const width = item.aspectRatio * height;
      tiles.push({
        ...item.picture,
        left: (x / boxWidth) * 100,
        top: (y / boxHeight) * 100,
        width: (width / boxWidth) * 100,
        height: (height / boxHeight) * 100,
        pxWidth: width,
        pxHeight: height,
      });
      x += width + scaledGap;
    }
    y += height + scaledGap;
  }
  return tiles;
};
