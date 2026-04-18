import { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { contactSchema, type ContactFormData } from '@/lib/validations';
import { safeMutation } from '@/lib/supabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const COOLDOWN_SECONDS = 3;

const contactInfo = [
  {
    icon: <Mail className="h-5 w-5" />,
    label: 'Email',
    value: 'vetmedix.25@gmail.com',
    href: 'mailto:vetmedix.25@gmail.com',
  },
  {
    icon: <Phone className="h-5 w-5" />,
    label: 'Phone',
    value: '01349219441',
    href: 'tel:+8801349219441',
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    label: 'Location',
    value: 'Framgate, Dhaka, 1205',
    href: null,
  },
];

const ContactPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = async (data: ContactFormData) => {
    if (cooldown > 0) return;

    const insertPromise = Promise.resolve(
      supabase.from('contact_messages').insert({
        name: data.name.trim(),
        email: data.email.trim(),
        subject: data.subject?.trim() || null,
        message: data.message.trim(),
      }).select()
    );

    const result = await safeMutation(insertPromise, {
        successMsg: "Message sent successfully! We'll get back to you soon.",
        errorMsg: 'Failed to send message. Please try again.',
      }
    );

    if (!result.error) {
      setSubmitted(true);
      setCooldown(COOLDOWN_SECONDS);
      form.reset();
    }
  };

  const handleSendAnother = useCallback(() => {
    if (cooldown > 0) return;
    setSubmitted(false);
    form.reset();
  }, [cooldown, form]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO
        title="Contact Us"
        description="Have questions about VetMedix? Get in touch with our team for support, feedback, or partnership inquiries."
        canonicalUrl="https://vetmedix.lovable.app/contact"
      />
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-4 py-8 sm:py-12 animate-page-enter">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Get in Touch
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions about VetMedix? We'd love to hear from you. 
              Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info - Left */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                  <CardDescription>Reach out through any of these channels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        {item.href ? (
                          <a href={item.href} className="font-medium hover:text-primary transition-colors">
                            {item.value}
                          </a>
                        ) : (
                          <p className="font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Saturday - Thursday: 9:00 AM - 6:00 PM</p>
                    <p>Friday: Closed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form - Right */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!user ? (
                    <div className="text-center py-8">
                      <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Sign in Required</h3>
                      <p className="text-muted-foreground mb-4">
                        Please sign in to send us a message. This helps us prevent spam and respond to you faster.
                      </p>
                      <Button onClick={() => navigate('/auth')} className="min-h-[44px]">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In to Contact Us
                      </Button>
                    </div>
                  ) : submitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-success" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground mb-4">
                        Thank you for contacting us. We'll respond to your inquiry shortly.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={handleSendAnother}
                        disabled={cooldown > 0}
                        className="min-h-[44px]"
                      >
                        {cooldown > 0 ? `Wait ${cooldown}s...` : 'Send Another Message'}
                      </Button>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label="Contact form">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name <span aria-hidden="true">*</span></FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Your name"
                                    className="min-h-[44px] text-base"
                                    maxLength={100}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email <span aria-hidden="true">*</span></FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    className="min-h-[44px] text-base"
                                    maxLength={255}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="How can we help?"
                                  className="min-h-[44px] text-base"
                                  maxLength={200}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message <span aria-hidden="true">*</span></FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us more about your inquiry..."
                                  rows={5}
                                  className="min-h-[44px] text-base"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button
                          type="submit"
                          className="w-full sm:w-auto min-h-[44px]"
                          disabled={form.formState.isSubmitting || cooldown > 0}
                        >
                          {form.formState.isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                              <span>Send Message</span>
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default ContactPage;
