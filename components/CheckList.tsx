/** Yes/no checks. `good` decides the colour: a green tick or an amber flag. */
export function CheckList({ items }: { items: { label: string; good: boolean; detail?: string }[] }) {
  return (
    <ul className="checks">
      {items.map((it) => (
        <li key={it.label} className={it.good ? "check-good" : "check-bad"}>
          <span aria-hidden>{it.good ? "✓" : "!"}</span>
          <div>
            {it.label}
            {it.detail && <div className="muted">{it.detail}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}
