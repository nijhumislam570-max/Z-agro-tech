import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { COURSE_CATEGORIES, type CourseCategory } from '@/hooks/useCourses';

interface Props {
  value: CourseCategory | 'all';
  onChange: (v: CourseCategory | 'all') => void;
}

const ALL: Array<{ value: CourseCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  ...COURSE_CATEGORIES,
];

export const CourseCategoryChips = ({ value, onChange }: Props) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {ALL.map((cat) => {
        const active = value === cat.value;
        return (
          <Button
            key={cat.value}
            type="button"
            variant={active ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(cat.value)}
            className={cn(
              'rounded-full text-xs sm:text-sm h-8 sm:h-9',
              active && 'shadow-soft',
            )}
          >
            {cat.label}
          </Button>
        );
      })}
    </div>
  );
};

export default CourseCategoryChips;
