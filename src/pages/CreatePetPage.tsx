import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage, getCompressionMessage } from '@/lib/mediaCompression';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { petFormSchema, type PetFormData } from '@/lib/validations';
import { safeMutation } from '@/lib/supabaseService';

const speciesOptions = [
  'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 
  'Guinea Pig', 'Turtle', 'Snake', 'Lizard', 'Horse', 'Cow', 'Goat', 'Sheep', 'Other'
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const CreatePetPage = () => {
  useDocumentTitle('Add New Pet');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshPets } = usePets();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PetFormData>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: '',
      species: '',
      breed: '',
      age: '',
      bio: '',
    },
  });

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error('Image must be less than 5MB');
        return;
      }
      if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: PetFormData) => {
    if (!user) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }

    setSubmitting(true);
    try {
      let avatarUrl = null;

      // Upload avatar if provided
      if (avatarFile) {
        const compressed = await compressImage(avatarFile, 'avatar');
        
        if (compressed.compressionRatio > 1) {
          toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
        }

        const fileExt = compressed.file.name.split('.').pop();
        const fileName = `${user.id}/avatars/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pet-media')
          .upload(fileName, compressed.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-media')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Create pet profile using safeMutation
      const insertQuery = supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: values.name.trim(),
          species: values.species,
          breed: values.breed?.trim() || null,
          age: values.age?.trim() || null,
          bio: values.bio?.trim() || null,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      const { data: petData, error: insertError } = await insertQuery;

      if (insertError) {
        const msg = insertError.message || '';
        if (msg.includes('30') || msg.includes('limit')) {
          toast.error('Maximum limit of 30 pets reached. Please remove a pet before adding a new one.');
        } else {
          toast.error('Failed to create pet profile');
        }
        if (import.meta.env.DEV) console.error('Error creating pet:', insertError);
        return;
      }

      toast.success('Pet profile created!');
      await refreshPets();
      navigate(`/pet/${petData.id}`);
    } catch (error: any) {
      // Catch the check_pet_limit trigger exception
      const msg = error?.message || '';
      if (msg.includes('30') || msg.includes('limit')) {
        toast.error('Maximum limit of 30 pets reached. Please remove a pet before adding a new one.');
      } else {
        toast.error('Failed to create pet profile');
      }
      if (import.meta.env.DEV) {
        console.error('Error creating pet:', error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Auth guard handled by RequireAuth wrapper in App.tsx

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-lg">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create Pet Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar */}
                <div className="flex justify-center">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {form.watch('name')?.charAt(0) || '🐾'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your pet's name" maxLength={50} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Species */}
                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select species" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {speciesOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Breed */}
                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Golden Retriever, Persian" maxLength={50} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Age */}
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 2 years, 6 months" maxLength={30} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Tell us about your pet..." maxLength={300} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Pet Profile'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default CreatePetPage;