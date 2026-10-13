export function EmptyState({
  title,
  lead,
  action,
}: {
  title: string;
  lead: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rise rounded-2xl bg-ivory px-6 py-12 text-center shadow-card">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-soft">{lead}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
