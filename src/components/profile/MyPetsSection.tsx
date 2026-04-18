import { Link } from "react-router-dom";
import { Plus, Eye, Edit, MessageSquarePlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Pet } from "@/types/social";

interface MyPetsSectionProps {
  pets: Pet[];
  loading: boolean;
}

const MyPetsSection = ({ pets, loading }: MyPetsSectionProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-muted mb-4" />
                <div className="h-4 w-24 bg-muted rounded mb-2" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {pets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{pets.length}</p>
              <p className="text-sm text-muted-foreground">Total Pets</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-coral/5 to-coral/10 border-coral/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-coral">
                {pets.reduce((sum, pet) => sum + ((pet as Pet & { followers_count?: number }).followers_count || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Followers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-accent">
                {pets.reduce((sum, pet) => sum + ((pet as Pet & { posts_count?: number }).posts_count || 0), 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-lavender/5 to-lavender/10 border-lavender/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-lavender">{pets.filter((p) => p.species === "Dog").length}</p>
              <p className="text-sm text-muted-foreground">Dogs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pets.map((pet) => (
          <Card
            key={pet.id}
            className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden"
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg group-hover:scale-105 transition-transform">
                    <AvatarImage src={pet.avatar_url || undefined} alt={pet.name} />
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                      {pet.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-1 -right-1 text-2xl">
                    {pet.species === "Dog" ? "🐕" : pet.species === "Cat" ? "🐱" : pet.species === "Bird" ? "🐦" : "🐾"}
                  </span>
                </div>

                <h3 className="font-semibold text-lg text-foreground mb-1">{pet.name}</h3>
                <p className="text-sm text-muted-foreground mb-1">{pet.breed || pet.species}</p>

                {/* Pet Stats */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {(pet as Pet & { followers_count?: number }).followers_count || 0}
                  </span>
                  <span>•</span>
                  <span>{(pet as Pet & { posts_count?: number }).posts_count || 0} posts</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link to={`/pet/${pet.id}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </Link>
                  <Link to={`/pets/${pet.id}/edit`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                  <Link to="/feed">
                    <Button size="sm" variant="default" className="gap-1">
                      <MessageSquarePlus className="h-3 w-3" />
                      Post
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Pet Card */}
        <Link to="/pets/new">
          <Card className="h-full min-h-[280px] border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-pointer group">
            <CardContent className="h-full flex flex-col items-center justify-center p-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Add New Pet</h3>
              <p className="text-sm text-muted-foreground text-center">Register your furry friend</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Empty State */}
      {pets.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            You haven't added any pets yet. Start by registering your first pet!
          </p>
        </div>
      )}
    </div>
  );
};

export default MyPetsSection;
