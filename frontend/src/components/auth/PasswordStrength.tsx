function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const BAR_CLASSES = [
  "bg-danger",
  "bg-danger",
  "bg-warning",
  "bg-accent",
  "bg-success",
];

export function PasswordStrength({ password }: Readonly<{ password: string }>) {
  const score = scorePassword(password);
  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <meter
          min={0}
          max={4}
          low={2}
          high={3}
          optimum={4}
          value={score}
          aria-label={`Password strength: ${LABELS[score]}`}
          className="sr-only"
        />
        <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1">
          {[1, 2, 3, 4].map((step) => (
            <span
              key={step}
              className={`h-1 rounded-full transition-colors ${
                score >= step ? BAR_CLASSES[score] : "bg-hover"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-fg-subtle">{LABELS[score]}</span>
      </div>
    </div>
  );
}
