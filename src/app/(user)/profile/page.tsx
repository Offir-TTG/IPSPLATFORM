'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Shield,
  Bell,
  Globe,
  Key,
  Trash2
} from 'lucide-react';
import Image from 'next/image';

// MOCKUP DATA
const mockUser = {
  id: 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc',
  first_name: 'Offir',
  last_name: 'Omer',
  email: 'offir.omer@gmail.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Offir',
  location: 'Tel Aviv, Israel',
  timezone: 'Asia/Jerusalem',
  language: 'English',
  joined_date: '2024-09-01',
  role: 'student',
  verified: true,
  bio: 'Passionate learner exploring web development and data science. Love building things and solving problems.',
  social: {
    linkedin: 'linkedin.com/in/offiromer',
    github: 'github.com/offiromer',
    website: 'offiromer.com'
  }
};

const mockBillingInfo = {
  payment_method: {
    type: 'visa',
    last4: '4242',
    expires: '12/2026',
    name: 'Offir Omer'
  },
  billing_address: {
    street: '123 Rothschild Blvd',
    city: 'Tel Aviv',
    state: '',
    zip: '6688101',
    country: 'Israel'
  },
  subscription: {
    plan: 'Pro',
    status: 'active',
    billing_cycle: 'monthly',
    amount: 49.99,
    currency: 'USD',
    next_billing_date: '2025-02-20',
    auto_renew: true
  }
};

const mockInvoices = [
  {
    id: 'inv_001',
    date: '2025-01-20',
    description: 'Pro Plan - Monthly Subscription',
    amount: 49.99,
    status: 'paid',
    invoice_url: '#'
  },
  {
    id: 'inv_002',
    date: '2024-12-20',
    description: 'Pro Plan - Monthly Subscription',
    amount: 49.99,
    status: 'paid',
    invoice_url: '#'
  },
  {
    id: 'inv_003',
    date: '2024-11-20',
    description: 'Pro Plan - Monthly Subscription',
    amount: 49.99,
    status: 'paid',
    invoice_url: '#'
  },
  {
    id: 'inv_004',
    date: '2024-10-20',
    description: 'Professional Photography Course',
    amount: 299.00,
    status: 'paid',
    invoice_url: '#'
  }
];

const mockEnrollments = [
  {
    id: 'enr_001',
    program: 'Full Stack Web Development Bootcamp',
    amount: 1299.00,
    enrolled_date: '2025-01-15',
    payment_status: 'paid'
  },
  {
    id: 'enr_002',
    program: 'Data Science & Machine Learning',
    amount: 1499.00,
    enrolled_date: '2025-02-01',
    payment_status: 'paid'
  },
  {
    id: 'enr_003',
    program: 'Professional Photography Course',
    amount: 299.00,
    enrolled_date: '2024-09-01',
    payment_status: 'paid'
  }
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{
          fontSize: 'var(--font-size-3xl)',
          fontFamily: 'var(--font-family-heading)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'hsl(var(--text-heading))',
          marginBottom: '0.5rem'
        }}>Account Settings</h1>
        <p style={{
          color: 'hsl(var(--text-muted))',
          fontSize: 'var(--font-size-base)',
          fontFamily: 'var(--font-family-primary)'
        }}>
          Manage your profile, billing, and preferences
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          {/* Profile Card */}
          <Card className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <Image
                src={mockUser.avatar}
                alt={`${mockUser.first_name} ${mockUser.last_name}`}
                width={120}
                height={120}
                className="rounded-full border-4 border-muted"
              />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'hsl(var(--text-heading))'
                  }}>
                    {mockUser.first_name} {mockUser.last_name}
                  </h2>
                  {mockUser.verified && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      backgroundColor: 'rgb(37, 99, 235)',
                      color: 'white',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      <CheckCircle2 className="ltr:mr-1 rtl:ml-1 h-3 w-3" />
                      Verified
                    </span>
                  )}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    paddingInlineStart: '0.625rem',
                    paddingInlineEnd: '0.625rem',
                    paddingTop: '0.25rem',
                    paddingBottom: '0.25rem',
                    backgroundColor: 'hsl(var(--secondary))',
                    color: 'hsl(var(--secondary-foreground))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>{mockUser.role}</span>
                </div>
                <p style={{
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '1rem',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)'
                }}>{mockUser.bio}</p>
                <div className="flex gap-2">
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
                      paddingTop: '0.375rem',
                      paddingBottom: '0.375rem',
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      transition: 'opacity 0.2s'
                    }}
                    className="hover:opacity-90"
                  >
                    <Edit className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    Edit Profile
                  </button>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
                      paddingTop: '0.375rem',
                      paddingBottom: '0.375rem',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      backgroundColor: 'transparent',
                      color: 'hsl(var(--text-body))',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      transition: 'background-color 0.2s'
                    }}
                    className="hover:bg-accent"
                  >
                    <User className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    Change Avatar
                  </button>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))',
                  marginBottom: '1rem'
                }}>Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-body))'
                  }}>
                    <Mail className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                    <span>{mockUser.email}</span>
                  </div>
                  <div className="flex items-center gap-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-body))'
                  }}>
                    <Phone className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                    <span>{mockUser.phone}</span>
                  </div>
                  <div className="flex items-center gap-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-body))'
                  }}>
                    <MapPin className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                    <span>{mockUser.location}</span>
                  </div>
                  <div className="flex items-center gap-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-body))'
                  }}>
                    <Calendar className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                    <span>Joined {new Date(mockUser.joined_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))',
                  marginBottom: '1rem'
                }}>Social Links</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    <Globe className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                    <a href={`https://${mockUser.social.website}`} style={{ color: 'hsl(var(--primary))' }} className="hover:underline">
                      {mockUser.social.website}
                    </a>
                  </div>
                  <div className="flex items-center gap-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    <Globe className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                    <a href={`https://${mockUser.social.linkedin}`} style={{ color: 'hsl(var(--primary))' }} className="hover:underline">
                      {mockUser.social.linkedin}
                    </a>
                  </div>
                  <div className="flex items-center gap-3" style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)'
                  }}>
                    <Globe className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                    <a href={`https://${mockUser.social.github}`} style={{ color: 'hsl(var(--primary))' }} className="hover:underline">
                      {mockUser.social.github}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing" className="space-y-6">
          {/* Subscription Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--text-heading))',
                  marginBottom: '0.25rem'
                }}>Current Subscription</h3>
                <p style={{
                  color: 'hsl(var(--text-muted))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)'
                }}>Manage your subscription and billing</p>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingInlineStart: '1rem',
                paddingInlineEnd: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                backgroundColor: 'rgb(22, 163, 74)',
                color: 'white',
                borderRadius: 'calc(var(--radius) * 1.5)',
                fontSize: 'var(--font-size-lg)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                {mockBillingInfo.subscription.plan} Plan
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem'
                }}>Billing Cycle</p>
                <p style={{
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))',
                  textTransform: 'capitalize'
                }}>{mockBillingInfo.subscription.billing_cycle}</p>
              </div>
              <div>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem'
                }}>Amount</p>
                <p style={{
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))'
                }}>
                  ${mockBillingInfo.subscription.amount} {mockBillingInfo.subscription.currency}
                </p>
              </div>
              <div>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem'
                }}>Next Billing Date</p>
                <p style={{
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))'
                }}>
                  {new Date(mockBillingInfo.subscription.next_billing_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'hsl(var(--text-body))'
                }}>Auto-renewal is {mockBillingInfo.subscription.auto_renew ? 'enabled' : 'disabled'}</span>
              </div>
              <button
                style={{
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.375rem',
                  paddingBottom: '0.375rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-accent"
              >
                Manage Subscription
              </button>
            </div>

            <div className="flex gap-2">
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  transition: 'opacity 0.2s'
                }}
                className="hover:opacity-90"
              >
                Upgrade Plan
              </button>
              <button
                style={{
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-accent"
              >
                Cancel Subscription
              </button>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>Payment Method</h3>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.375rem',
                  paddingBottom: '0.375rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-accent"
              >
                <Edit className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                Update
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="p-3 bg-background rounded">
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))',
                  textTransform: 'capitalize'
                }}>{mockBillingInfo.payment_method.type} •••• {mockBillingInfo.payment_method.last4}</p>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))'
                }}>
                  Expires {mockBillingInfo.payment_method.expires}
                </p>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingInlineStart: '0.625rem',
                paddingInlineEnd: '0.625rem',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
                backgroundColor: 'hsl(var(--secondary))',
                color: 'hsl(var(--secondary-foreground))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>Default</span>
            </div>

            <Separator className="my-6" />

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.75rem'
              }}>Billing Address</h4>
              <div className="space-y-1" style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>
                <p>{mockBillingInfo.payment_method.name}</p>
                <p>{mockBillingInfo.billing_address.street}</p>
                <p>{mockBillingInfo.billing_address.city}, {mockBillingInfo.billing_address.zip}</p>
                <p>{mockBillingInfo.billing_address.country}</p>
              </div>
            </div>
          </Card>

          {/* Billing History */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>Billing History</h3>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.375rem',
                  paddingBottom: '0.375rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-accent"
              >
                <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                Export
              </button>
            </div>

            <div className="space-y-3">
              {mockInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'hsl(var(--text-heading))'
                      }}>{invoice.description}</p>
                      <div className="flex items-center gap-2" style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(invoice.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--text-heading))'
                      }}>${invoice.amount.toFixed(2)}</p>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        paddingInlineStart: '0.625rem',
                        paddingInlineEnd: '0.625rem',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                        backgroundColor: invoice.status === 'paid' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                        color: invoice.status === 'paid' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        {invoice.status}
                      </span>
                    </div>
                    <button
                      style={{
                        padding: '0.375rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--text-body))',
                        transition: 'background-color 0.2s',
                        borderRadius: 'calc(var(--radius))'
                      }}
                      className="hover:bg-accent"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Enrollments */}
          <Card className="p-6">
            <h3 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem'
            }}>Program Enrollments</h3>
            <div className="space-y-3">
              {mockEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))',
                      marginBottom: '0.25rem'
                    }}>{enrollment.program}</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>
                      Enrolled {new Date(enrollment.enrolled_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'hsl(var(--text-heading))',
                      marginBottom: '0.25rem'
                    }}>${enrollment.amount.toFixed(2)}</p>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      <CheckCircle2 className="ltr:mr-1 rtl:ml-1 h-3 w-3" />
                      {enrollment.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem'
            }}>Password & Authentication</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))'
                    }}>Password</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>Last changed 3 months ago</p>
                  </div>
                </div>
                <button
                  style={{
                    paddingInlineStart: '0.75rem',
                    paddingInlineEnd: '0.75rem',
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                >Change Password</button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))'
                    }}>Two-Factor Authentication</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>Add an extra layer of security</p>
                  </div>
                </div>
                <button
                  style={{
                    paddingInlineStart: '0.75rem',
                    paddingInlineEnd: '0.75rem',
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                >Enable 2FA</button>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '1rem'
              }}>Active Sessions</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))'
                    }}>Current Session</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>Tel Aviv, Israel • Chrome on Windows</p>
                  </div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    paddingInlineStart: '0.625rem',
                    paddingInlineEnd: '0.625rem',
                    paddingTop: '0.25rem',
                    paddingBottom: '0.25rem',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>Active</span>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '0.25rem'
                  }} className="text-red-900 dark:text-red-100">Danger Zone</p>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    marginBottom: '0.75rem'
                  }} className="text-red-700 dark:text-red-300">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
                      paddingTop: '0.375rem',
                      paddingBottom: '0.375rem',
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'hsl(var(--destructive-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      transition: 'opacity 0.2s'
                    }}
                    className="hover:opacity-90"
                  >
                    <Trash2 className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6">
            <h3 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem'
            }}>Notifications</h3>

            <div className="space-y-4">
              {[
                { id: 'email_lessons', label: 'Lesson reminders', description: 'Get notified about upcoming lessons' },
                { id: 'email_achievements', label: 'Achievement updates', description: 'Celebrate your learning milestones' },
                { id: 'email_assignments', label: 'Assignment due dates', description: 'Never miss a deadline' },
                { id: 'email_announcements', label: 'Course announcements', description: 'Important updates from instructors' }
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'hsl(var(--text-heading))'
                      }}>{pref.label}</p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>{pref.description}</p>
                    </div>
                  </div>
                  <button
                    style={{
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
                      paddingTop: '0.375rem',
                      paddingBottom: '0.375rem',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      backgroundColor: 'transparent',
                      color: 'hsl(var(--text-body))',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      transition: 'background-color 0.2s'
                    }}
                    className="hover:bg-accent"
                  >Enabled</button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem'
            }}>Regional Settings</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))'
                    }}>Language</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>{mockUser.language}</p>
                  </div>
                </div>
                <button
                  style={{
                    paddingInlineStart: '0.75rem',
                    paddingInlineEnd: '0.75rem',
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                >Change</button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))'
                    }}>Timezone</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>{mockUser.timezone}</p>
                  </div>
                </div>
                <button
                  style={{
                    paddingInlineStart: '0.75rem',
                    paddingInlineEnd: '0.75rem',
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                >Change</button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
