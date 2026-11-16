export default function Hoop() {
  return (
    <svg width="160" height="150" viewBox="0 0 160 150">
      {/* backboard */}
      <rect x="40" y="0" width="80" height="50" fill="none" stroke="#ea580c" strokeWidth="3" />

      {/* net */}
      <g stroke="#9ca3af" strokeWidth="1.5">
        <line x1="20" y1="62" x2="55" y2="140" />
        <line x1="50" y1="62" x2="65" y2="140" />
        <line x1="80" y1="62" x2="80" y2="140" />
        <line x1="110" y1="62" x2="95" y2="140" />
        <line x1="140" y1="62" x2="105" y2="140" />
        <line x1="25" y1="90" x2="135" y2="90" />
        <line x1="35" y1="115" x2="125" y2="115" />
      </g>

      {/* rim */}
      <ellipse cx="80" cy="60" rx="62" ry="8" fill="none" stroke="#ea580c" strokeWidth="4" />
    </svg>
  );
}