export function ProgressBar({
  value,
  label,
  color,
  size = "md",
}: {
  value: number; // 0-100
  label?: string;
  color?: string;
  size?: "sm" | "md";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const h = size === "sm" ? "h-2" : "h-3";
  return (
    <div>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-ink">
          <span>{label}</span>
          <span className="text-text-secondary">{clamped}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progreso"}
        className={`w-full overflow-hidden rounded-full border-[1.5px] border-ink bg-white ${h}`}
      >
        <div
          className="animate-progress h-full rounded-full"
          style={{ width: `${clamped}%`, backgroundColor: color ?? "var(--ink)" }}
        />
      </div>
    </div>
  );
}

export function SegmentedProgressBar({
  segments,
  size = "md",
}: {
  segments: { color: string; value: number; label?: string }[];
  size?: "sm" | "md";
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const h = size === "sm" ? "h-2" : "h-3";
  return (
    <div className={`flex w-full overflow-hidden rounded-full border-[1.5px] border-ink bg-white ${h}`}>
      {segments.map((s, i) => (
        <div
          key={i}
          className="animate-progress h-full"
          style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
          title={s.label}
        />
      ))}
    </div>
  );
}
