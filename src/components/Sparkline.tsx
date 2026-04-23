export function Sparkline({
  points,
  up,
  width = 96,
  height = 28,
}: {
  points: number[];
  up: boolean;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = up ? "var(--up)" : "var(--down)";
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <path d={d} fill="none" stroke={color} strokeWidth={1.25} />
      <path
        d={`${d} L${width},${height} L0,${height} Z`}
        fill={color}
        opacity={0.08}
      />
    </svg>
  );
}
