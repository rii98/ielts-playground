import { formatBand } from "./labels.ts";

/** A band number in a circle. `size="lg"` for the overall band. */
export function BandBadge({ band, label, size = "md" }: { band: number; label?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`band band-${size}`}>
      <span className="band-num">{formatBand(band)}</span>
      {label && <span className="band-label">{label}</span>}
    </div>
  );
}
