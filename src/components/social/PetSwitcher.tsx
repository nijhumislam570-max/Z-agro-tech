import { Check, ChevronDown, Plus, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePets } from '@/contexts/PetContext';
import { useNavigate } from 'react-router-dom';

export const PetSwitcher = () => {
  const { pets, activePet, setActivePet } = usePets();
  const navigate = useNavigate();

  if (pets.length === 0) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate('/pets/new')}
        className="h-9 w-9 text-primary hover:bg-primary/10"
      >
        <PawPrint className="h-[18px] w-[18px]" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activePet?.avatar_url || ''} alt={activePet?.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {activePet?.name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium hidden sm:inline">{activePet?.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {pets.map((pet) => (
          <DropdownMenuItem
            key={pet.id}
            onClick={() => setActivePet(pet)}
            className="flex items-center gap-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={pet.avatar_url || ''} alt={pet.name} />
              <AvatarFallback className="bg-primary/10 text-xs">
                {pet.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">{pet.name}</p>
              <p className="text-xs text-muted-foreground">{pet.species}</p>
            </div>
            {activePet?.id === pet.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/pets/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Another Pet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
