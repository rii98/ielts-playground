/** The student's paragraph next to a stronger version, with what changed. */
export function RewriteCard({ original, rewritten, whatChanged }: { original: string; rewritten: string; whatChanged: string }) {
  return (
    <div className="rewrite">
      <div className="card rewrite-col">
        <h4>Yours</h4>
        <p>{original}</p>
      </div>
      <div className="card rewrite-col rewrite-better">
        <h4>Stronger</h4>
        <p>{rewritten}</p>
      </div>
      <p className="rewrite-why">
        <strong>What changed: </strong>
        {whatChanged}
      </p>
    </div>
  );
}
