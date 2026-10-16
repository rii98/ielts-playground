/** A plain list of short points (e.g. next actions). */
export function BulletList({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  const List = numbered ? "ol" : "ul";
  return (
    <List className="bullets">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </List>
  );
}
