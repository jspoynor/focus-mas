export function CrownIcon({ opacity = 0.15 }: { opacity?: number }) {
  return (
    <img
      src="/crown.png"
      alt=""
      style={{ width: '100%', height: '100%', opacity }}
      aria-hidden="true"
    />
  )
}
