export function DemoBadge() {
  return (
    <span
      title="Estos datos son de demostración. La persistencia real llega en la próxima fase."
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-white px-2.5 py-1 text-[11px] font-medium text-ink/70"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink/40" />
      Datos de demostración
    </span>
  );
}
