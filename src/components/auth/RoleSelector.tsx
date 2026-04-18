import { User, Building2, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';

// Support three roles: user, clinic_owner, and doctor
export type SignupRole = 'user' | 'clinic_owner' | 'doctor';

interface RoleSelectorProps {
  selectedRole: SignupRole;
  onRoleSelect: (role: SignupRole) => void;
}

const roles = [
  {
    id: 'user' as SignupRole,
    title: 'Pet Parent',
    description: 'I have pets and want to connect, shop, and book appointments',
    icon: User,
  },
  {
    id: 'doctor' as SignupRole,
    title: 'Veterinary Doctor',
    description: 'I am a licensed veterinarian looking to practice',
    icon: Stethoscope,
  },
  {
    id: 'clinic_owner' as SignupRole,
    title: 'Clinic Owner',
    description: 'I own or manage a veterinary clinic',
    icon: Building2,
  },
];

export const RoleSelector = ({ selectedRole, onRoleSelect }: RoleSelectorProps) => {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-foreground mb-1">I am a...</p>
      {roles.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;
        
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onRoleSelect(role.id)}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left',
              'hover:border-primary/50 hover:bg-primary/5',
              isSelected 
                ? 'border-primary bg-primary/10' 
                : 'border-border bg-card'
            )}
          >
            <div className={cn(
              'p-2 rounded-lg',
              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'font-medium',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {role.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {role.description}
              </p>
            </div>
            <div className={cn(
              'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
            )}>
              {isSelected && (
                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
