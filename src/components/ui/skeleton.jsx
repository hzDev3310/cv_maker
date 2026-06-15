export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-low/80 ${className}`}
    />
  );
}
