// Collage layout: up to MAX_TILES photos in rows that span the full width of
// the box and together fill its full height. Photos keep their aspect ratio
// within a row (each row is scaled to exactly the box width), and then every
// row is scaled vertically by the same factor so the rows fill the height.
// That factor is how far the tiles drift from their photos' shapes, and tiles
// make it up by cropping (object-cover). Photos are chosen by aspect ratio to
// keep it close to 1: many candidate layouts are tried, each row's last photo
// is the one whose shape best completes the row, and the layout with the least
// cropping wins (with a small preference for showing more photos).

export const MAX_TILES = 6;

const GAP_RATIO = 0.015; // gap between tiles, as a share of the shorter side
const ATTEMPTS = 600; // candidate layouts tried per collage (~1ms in total)
const SAMPLE_SIZE = 12; // candidates considered when completing a row
// Score added per photo below MAX_TILES. Cropping is scored as |ln(stretch)|,
// so 0.05 means one more photo is worth about 5% extra crop.
const TILE_BONUS = 0.05;

const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// Splits `count` photos into `rows` rows of near-equal size, in random order.
const splitIntoRows = (count, rows) =>
  shuffle(
    Array.from(
      { length: rows },
      (_, i) => Math.floor(count / rows) + (i < count % rows ? 1 : 0),
    ),
  );

// One candidate: picks photos for each row and measures the vertical stretch
// needed to fill the box.
const candidate = (pool, boxWidth, boxHeight, gap) => {
  const count = randomInt(Math.min(2, pool.length), Math.min(MAX_TILES, pool.length));
  const rowCount = randomInt(1, Math.min(3, count));
  const rowTargetHeight = (boxHeight - gap * (rowCount - 1)) / rowCount;

  const remaining = shuffle(pool);
  const rows = splitIntoRows(count, rowCount).map((slots) => {
    const rowWidth = boxWidth - gap * (slots - 1);
    const targetRatio = rowWidth / rowTargetHeight;
    const items = remaining.splice(0, slots - 1);
    // The row's last photo is chosen by aspect ratio to complete the row.
    const room =
      targetRatio - items.reduce((sum, item) => sum + item.aspectRatio, 0);
    const sample = remaining.slice(0, SAMPLE_SIZE);
    let best = 0;
    for (let i = 1; i < sample.length; i++) {
      if (
        Math.abs(sample[i].aspectRatio - room) <
        Math.abs(sample[best].aspectRatio - room)
      ) {
        best = i;
      }
    }
    items.push(...remaining.splice(best, 1));
    const ratioSum = items.reduce((sum, item) => sum + item.aspectRatio, 0);
    return { items, naturalHeight: rowWidth / ratioSum };
  });

  const naturalTotal = rows.reduce((sum, row) => sum + row.naturalHeight, 0);
  const stretch = (boxHeight - gap * (rowCount - 1)) / naturalTotal;
  const score =
    Math.abs(Math.log(stretch)) + TILE_BONUS * (MAX_TILES - count);
  return { rows, stretch, score };
};

// `pool` items need `width` and `height`. Returns tiles with `left`, `top`,
// `width` and `height` as percentages of the box, plus `pxWidth`/`pxHeight`.
export const buildCollage = (pool, boxWidth, boxHeight) => {
  const gap = Math.min(boxWidth, boxHeight) * GAP_RATIO;
  const items = pool.map((picture) => ({
    picture,
    aspectRatio: picture.width / picture.height,
  }));

  let best = null;
  for (let i = 0; i < ATTEMPTS; i++) {
    const option = candidate(items, boxWidth, boxHeight, gap);
    if (!best || option.score < best.score) best = option;
  }

  const tiles = [];
  let y = 0;
  for (const row of best.rows) {
    const height = row.naturalHeight * best.stretch;
    // Natural widths already span the box exactly; only height is stretched.
    let x = 0;
    for (const item of row.items) {
      const width = item.aspectRatio * row.naturalHeight;
      tiles.push({
        ...item.picture,
        left: (x / boxWidth) * 100,
        top: (y / boxHeight) * 100,
        width: (width / boxWidth) * 100,
        height: (height / boxHeight) * 100,
        pxWidth: width,
        pxHeight: height,
      });
      x += width + gap;
    }
    y += height + gap;
  }
  return tiles;
};
