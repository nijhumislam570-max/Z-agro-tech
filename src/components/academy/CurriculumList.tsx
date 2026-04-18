import { CheckCircle2 } from 'lucide-react';

export const CurriculumList = ({ items }: { items: string[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <ul className="grid sm:grid-cols-2 gap-2">
      {items.map((topic, i) => (
        <li
          key={i}
          className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/60 p-3 text-sm text-foreground"
        >
          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <span className="leading-relaxed">{topic}</span>
        </li>
      ))}
    </ul>
  );
};

export default CurriculumList;
