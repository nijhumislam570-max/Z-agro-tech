import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { COURSE_CATEGORIES, type CourseCategory } from '@/hooks/useCourses';

interface Props {
  value: CourseCategory | 'all';
  onChange: (v: CourseCategory | 'all') => void;
  counts?: Partial<Record<CourseCategory | 'all', number>>;
}

const ALL: Array<{ value: CourseCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  ...COURSE_CATEGORIES,
];

export const CourseCategoryChips = ({ value, onChange, counts }: Props) => {
  return (
    <div className="flex gap-2 overflow-x-auto snap-x scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center sm:overflow-visible">
      {ALL.map((cat) => {
        const active = value === cat.value;
        const count = counts?.[cat.value];
        return (
          <Button
            key={cat.value}
            type="button"
            variant={active ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange(cat.value)}
            className={cn(
              'rounded-full text-xs sm:text-sm h-8 sm:h-9 gap-1.5 snap-start shrink-0',
              active && 'shadow-soft',
            )}
          >
            {cat.label}
            {typeof count === 'number' && (
              <Badge
                variant="secondary"
                className={cn(
                  'h-5 min-w-5 px-1.5 text-[10px] font-semibold rounded-full',
                  active
                    ? 'bg-primary-foreground/20 text-primary-foreground border-transparent hover:bg-primary-foreground/20'
                    : 'bg-muted text-muted-foreground border-transparent',
                )}
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default CourseCategoryChips;
