import { useState, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const CurriculumEditor = ({
  value, onChange,
  label = 'Curriculum topics',
  placeholder = 'Add a topic and press Enter…',
}: Props) => {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (value.includes(v)) { setInput(''); return; }
    onChange([...value, v]);
    setInput('');
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
        />
        <Button type="button" size="icon" variant="secondary" onClick={add} aria-label="Add topic">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {value.map((topic, i) => (
            <Badge key={`${topic}-${i}`} variant="secondary" className="gap-1 pr-1">
              {topic}
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-full hover:bg-background/60 p-0.5"
                aria-label={`Remove ${topic}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default CurriculumEditor;
