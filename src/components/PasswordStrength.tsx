// Reusable password strength component
// Shows live criteria as user types

interface Props {
  password: string;
}

interface Criterion {
  label: string;
  met: boolean;
}

export function getPasswordCriteria(password: string): Criterion[] {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$...)", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordCriteria(password).every((c) => c.met);
}

export function PasswordStrength({ password }: Props) {
  if (!password) return null;

  const criteria = getPasswordCriteria(password);
  const metCount = criteria.filter((c) => c.met).length;

  const strength =
    metCount <= 1 ? "Weak" :
    metCount <= 3 ? "Fair" :
    metCount === 4 ? "Good" :
    "Strong";

  const strengthColor =
    metCount <= 1 ? "text-red-500" :
    metCount <= 3 ? "text-amber-500" :
    metCount === 4 ? "text-blue-500" :
    "text-green-500";

  const barColor =
    metCount <= 1 ? "bg-red-500" :
    metCount <= 3 ? "bg-amber-500" :
    metCount === 4 ? "bg-blue-500" :
    "bg-green-500";

  const barWidth = `${(metCount / 5) * 100}%`;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-border">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: barWidth }}
          />
        </div>
        <span className={`text-xs font-semibold ${strengthColor}`}>{strength}</span>
      </div>

      {/* Criteria list */}
      <ul className="space-y-1">
        {criteria.map((c) => (
          <li key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.met ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-muted-foreground">○</span>
            )}
            <span className={c.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
