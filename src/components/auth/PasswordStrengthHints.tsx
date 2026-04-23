import { Check, X } from 'lucide-react';

interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

const rules: Rule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'Contains a letter', test: (pw) => /[A-Za-z]/.test(pw) },
  { label: 'Contains a number', test: (pw) => /[0-9]/.test(pw) },
];

interface Props {
  password: string;
}

const PasswordStrengthHints = ({ password }: Props) => {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1" aria-label="Password requirements">
      {rules.map((rule) => {
        const passed = rule.test(password);
        const Icon = passed ? Check : X;
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs ${passed ? 'text-success' : 'text-muted-foreground'}`}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
};

export default PasswordStrengthHints;
