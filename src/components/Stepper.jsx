/** Big, thumb-friendly −/+ number control. */
export default function Stepper({ value, min = 1, max = 100, onChange, label }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="btn btn--icon" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Fewer ${label}`}>
        −
      </button>
      <output className="stepper__value">{value}</output>
      <button type="button" className="btn btn--icon" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}
