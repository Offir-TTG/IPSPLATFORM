'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useUserLanguage } from '@/context/AppContext';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function ContactPage() {
  const { t, direction } = useUserLanguage();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    console.log('Validating form...', formData);

    // Validate name
    if (!formData.name.trim()) {
      console.log('Name validation failed');
      toast({
        title: t('contact.validation.error', 'Validation Error'),
        description: t('contact.validation.nameRequired', 'Name is required'),
        variant: 'destructive',
      });
      return false;
    }

    // Validate email
    if (!formData.email.trim()) {
      toast({
        title: t('contact.validation.error', 'Validation Error'),
        description: t('contact.validation.emailRequired', 'Email is required'),
        variant: 'destructive',
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: t('contact.validation.error', 'Validation Error'),
        description: t('contact.validation.emailInvalid', 'Please enter a valid email address'),
        variant: 'destructive',
      });
      return false;
    }

    // Validate phone if provided
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast({
        title: t('contact.validation.error', 'Validation Error'),
        description: t('contact.validation.phoneInvalid', 'Please enter a valid phone number'),
        variant: 'destructive',
      });
      return false;
    }

    // Validate subject
    if (!formData.subject.trim()) {
      toast({
        title: t('contact.validation.error', 'Validation Error'),
        description: t('contact.validation.subjectRequired', 'Subject is required'),
        variant: 'destructive',
      });
      return false;
    }

    // Validate message
    if (!formData.message.trim()) {
      toast({
        title: t('contact.validation.error', 'Validation Error'),
        description: t('contact.validation.messageRequired', 'Message is required'),
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Form submitted');
    e.preventDefault();

    // Run custom validation
    if (!validateForm()) {
      console.log('Validation failed, stopping submission');
      return;
    }

    console.log('Validation passed, submitting form');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success state
        setIsSubmitted(true);
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      toast({
        title: t('contact.error.title', 'Error'),
        description: t('contact.error.description', 'Failed to send message. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={mounted ? direction : 'ltr'}>
      <PublicHeader />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            {/* Hero */}
            <div className="mb-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="mb-4 text-4xl font-bold text-foreground">
                {mounted ? t('contact.title', 'Contact Us') : 'Contact Us'}
              </h1>
              <p className="text-lg text-muted-foreground">
                {mounted ? t('contact.subtitle', 'Have questions? We\'d love to hear from you.') : 'Have questions? We\'d love to hear from you.'}
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      {mounted ? t('contact.info.email.title', 'Email') : 'Email'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href="mailto:support@tenafly-tg.com"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      support@tenafly-tg.com
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      {mounted ? t('contact.info.phone.title', 'Phone') : 'Phone'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {mounted ? t('contact.info.phone.description', 'Available Monday - Friday, 9AM - 5PM') : 'Available Monday - Friday, 9AM - 5PM'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {mounted ? t('contact.info.address.title', 'Address') : 'Address'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {mounted ? t('contact.info.address.description', 'We operate online worldwide') : 'We operate online worldwide'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{mounted ? t('contact.form.title', 'Send us a message') : 'Send us a message'}</CardTitle>
                    <CardDescription>
                      {mounted ? t('contact.form.description', 'Fill out the form below and we\'ll get back to you shortly.') : 'Fill out the form below and we\'ll get back to you shortly.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSubmitted ? (
                      <div className="py-12 text-center space-y-6">
                        <div className="flex justify-center">
                          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl font-bold text-foreground">
                            {mounted ? t('contact.success.title', 'Message Sent Successfully!') : 'Message Sent Successfully!'}
                          </h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            {mounted ? t('contact.success.description', 'Thank you for contacting us. We\'ll get back to you as soon as possible.') : 'Thank you for contacting us. We\'ll get back to you as soon as possible.'}
                          </p>
                        </div>
                        <Button
                          onClick={() => setIsSubmitted(false)}
                          variant="outline"
                        >
                          {mounted ? t('contact.success.sendAnother', 'Send Another Message') : 'Send Another Message'}
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} noValidate className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            {mounted ? t('contact.form.name.label', 'Full Name') : 'Full Name'} <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={mounted ? t('contact.form.name.placeholder', 'John Doe') : 'John Doe'}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">
                            {mounted ? t('contact.form.email.label', 'Email') : 'Email'} <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={mounted ? t('contact.form.email.placeholder', 'john@example.com') : 'john@example.com'}
                          />
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone">
                            {mounted ? t('contact.form.phone.label', 'Phone Number') : 'Phone Number'}
                          </Label>
                          <PhoneInput
                            international
                            defaultCountry="US"
                            value={formData.phone}
                            onChange={(value) => {
                              setFormData({
                                ...formData,
                                phone: value || '',
                              });
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">
                            {mounted ? t('contact.form.subject.label', 'Subject') : 'Subject'} <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="subject"
                            name="subject"
                            type="text"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder={mounted ? t('contact.form.subject.placeholder', 'How can we help?') : 'How can we help?'}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">
                          {mounted ? t('contact.form.message.label', 'Message') : 'Message'} <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder={mounted ? t('contact.form.message.placeholder', 'Tell us more about your inquiry...') : 'Tell us more about your inquiry...'}
                          rows={6}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            {mounted ? t('contact.form.sending', 'Sending...') : 'Sending...'}
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                            {mounted ? t('contact.form.submit', 'Send Message') : 'Send Message'}
                          </>
                        )}
                      </Button>
                    </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
