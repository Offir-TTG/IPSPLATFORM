'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Star,
  Clock,
  Users,
  Search,
  Filter,
  Grid3x3,
  List,
  ChevronDown,
  ArrowRight,
  GraduationCap,
  X
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';

// Mock data - will be replaced with API calls
const mockCourses = [
  {
    id: '1',
    title: 'React Advanced Patterns & Performance',
    description: 'Master advanced React concepts including hooks, context, performance optimization, and modern patterns',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    instructor: 'Alex Martinez',
    rating: 4.9,
    students: 2340,
    price: 299,
    duration: '12 hours',
    level: 'Advanced',
    category: 'Technology',
    type: 'course'
  },
  {
    id: '2',
    title: 'Python for Data Science',
    description: 'Learn Python programming essentials and data analysis with pandas, numpy, and matplotlib',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop',
    instructor: 'Dr. Lisa Wang',
    rating: 4.8,
    students: 3120,
    price: 249,
    duration: '15 hours',
    level: 'Beginner',
    category: 'Technology',
    type: 'course'
  },
  {
    id: '3',
    title: 'UI/UX Design Fundamentals',
    description: 'Create beautiful and user-friendly interfaces with modern design principles',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop',
    instructor: 'Sophie Turner',
    rating: 4.7,
    students: 1890,
    price: 199,
    duration: '10 hours',
    level: 'Intermediate',
    category: 'Design',
    type: 'course'
  },
  {
    id: 'p1',
    title: 'Full Stack Web Development Bootcamp',
    description: 'Complete program to become a full-stack developer with React, Node.js, and databases',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    instructor: 'Dr. Sarah Johnson',
    rating: 4.9,
    students: 1250,
    price: 2999,
    duration: '6 months',
    courses: 12,
    level: 'All Levels',
    category: 'Technology',
    type: 'program'
  },
  {
    id: 'p2',
    title: 'Data Science & AI Mastery',
    description: 'Comprehensive program covering Python, machine learning, and artificial intelligence',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    instructor: 'Prof. Michael Chen',
    rating: 4.9,
    students: 980,
    price: 3499,
    duration: '8 months',
    courses: 15,
    level: 'Intermediate',
    category: 'Technology',
    type: 'program'
  }
];

const categories = ['All', 'Technology', 'Business', 'Design', 'Photography', 'Marketing'];
const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Free', min: 0, max: 0 },
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 - $500', min: 100, max: 500 },
  { label: 'Over $500', min: 500, max: Infinity }
];

function BrowsePageContent() {
  const { t, direction } = useUserLanguage();
  const searchParams = useSearchParams();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [selectedPrice, setSelectedPrice] = useState(priceRanges[0]);
  const [contentType, setContentType] = useState<'all' | 'course' | 'program'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Get type from URL params
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'programs') {
      setContentType('program');
    } else if (type === 'courses') {
      setContentType('course');
    }
  }, [searchParams]);

  // Filter logic
  const filteredItems = mockCourses.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All Levels' || item.level === selectedLevel;
    const matchesPrice = item.price >= selectedPrice.min && item.price <= selectedPrice.max;
    const matchesType = contentType === 'all' || item.type === contentType;

    return matchesSearch && matchesCategory && matchesLevel && matchesPrice && matchesType;
  });

  const activeFiltersCount = [
    selectedCategory !== 'All',
    selectedLevel !== 'All Levels',
    selectedPrice.label !== 'All Prices',
    searchQuery !== ''
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
              <span style={{
                fontSize: 'var(--font-size-xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>EduPlatform</span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <button style={{
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer'
                }} className="hover:bg-accent transition-colors">
                  {t('public.nav.login', 'Login')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))',
            marginBottom: '0.5rem'
          }}>
            {contentType === 'program' ? t('public.browse.programs', 'Browse Programs') :
             contentType === 'course' ? t('public.browse.courses', 'Browse Courses') :
             t('public.browse.all', 'Browse All Content')}
          </h1>
          <p style={{
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)',
            color: 'hsl(var(--text-muted))'
          }}>
            {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} found
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="mb-6 space-y-4">
          {/* Content Type Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setContentType('all')}
              style={{
                paddingInlineStart: '1rem',
                paddingInlineEnd: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: 'calc(var(--radius) * 1.5)',
                border: '1px solid hsl(var(--border))',
                backgroundColor: contentType === 'all' ? 'hsl(var(--primary))' : 'transparent',
                color: contentType === 'all' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text-body))',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer'
              }}
              className="transition-colors"
            >
              {t('public.browse.all', 'All')}
            </button>
            <button
              onClick={() => setContentType('course')}
              style={{
                paddingInlineStart: '1rem',
                paddingInlineEnd: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: 'calc(var(--radius) * 1.5)',
                border: '1px solid hsl(var(--border))',
                backgroundColor: contentType === 'course' ? 'hsl(var(--primary))' : 'transparent',
                color: contentType === 'course' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text-body))',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer'
              }}
              className="transition-colors"
            >
              {t('public.browse.coursesOnly', 'Courses Only')}
            </button>
            <button
              onClick={() => setContentType('program')}
              style={{
                paddingInlineStart: '1rem',
                paddingInlineEnd: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                borderRadius: 'calc(var(--radius) * 1.5)',
                border: '1px solid hsl(var(--border))',
                backgroundColor: contentType === 'program' ? 'hsl(var(--primary))' : 'transparent',
                color: contentType === 'program' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text-body))',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer'
              }}
              className="transition-colors"
            >
              {t('public.browse.programsOnly', 'Programs Only')}
            </button>
          </div>

          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
              <Input
                type="text"
                placeholder={t('public.browse.searchPlaceholder', 'Search courses and programs...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: showFilters ? 'hsl(var(--accent))' : 'transparent',
                  color: 'hsl(var(--text-body))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  cursor: 'pointer'
                }}
                className="hover:bg-accent transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">{t('public.browse.filters', 'Filters')}</span>
                {activeFiltersCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-primary text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="flex rounded-md border" style={{ borderColor: 'hsl(var(--border))' }}>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: viewMode === 'grid' ? 'hsl(var(--accent))' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderTopLeftRadius: 'calc(var(--radius))',
                    borderBottomLeftRadius: 'calc(var(--radius))'
                  }}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: viewMode === 'list' ? 'hsl(var(--accent))' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderTopRightRadius: 'calc(var(--radius))',
                    borderBottomRightRadius: 'calc(var(--radius))'
                  }}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>{t('public.browse.category', 'Category')}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'calc(var(--radius))',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Level Filter */}
                <div>
                  <label style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>{t('public.browse.level', 'Level')}</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'calc(var(--radius))',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: '0.5rem',
                    display: 'block'
                  }}>{t('public.browse.price', 'Price')}</label>
                  <select
                    value={selectedPrice.label}
                    onChange={(e) => setSelectedPrice(priceRanges.find(p => p.label === e.target.value) || priceRanges[0])}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'calc(var(--radius))',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)'
                    }}
                  >
                    {priceRanges.map(range => (
                      <option key={range.label} value={range.label}>{range.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results */}
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-muted))' }} />
            <h3 style={{
              fontSize: 'var(--font-size-lg)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: '0.5rem'
            }}>{t('public.browse.noResults', 'No results found')}</h3>
            <p style={{
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-muted))'
            }}>{t('public.browse.tryDifferent', 'Try adjusting your filters or search query')}</p>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/browse/${item.type === 'program' ? 'programs' : 'courses'}/${item.id}`}
              >
                <Card className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full ${
                  viewMode === 'list' ? 'flex flex-row' : ''
                }`}>
                  <div className={`relative overflow-hidden ${
                    viewMode === 'list' ? 'w-64 h-48' : 'h-48'
                  }`}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded" style={{
                      backgroundColor: 'hsl(var(--background))',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      {item.level}
                    </div>
                    {item.type === 'program' && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-primary text-primary-foreground" style={{
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        Program
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1">
                    <h3 style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-heading)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'hsl(var(--text-heading))',
                      marginBottom: '0.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>{item.title}</h3>

                    {viewMode === 'list' && (
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{item.description}</p>
                    )}

                    <p style={{
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '0.75rem'
                    }}>{item.instructor}</p>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1" style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-body))'
                      }}>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{item.rating}</span>
                      </div>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>({item.students})</span>
                    </div>

                    <div className="flex items-center gap-3 mb-3" style={{
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>
                      {item.type === 'program' && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          <span>{item.courses} courses</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span style={{
                        fontSize: 'var(--font-size-lg)',
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'hsl(var(--text-heading))'
                      }}>${item.price}</span>
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'hsl(var(--primary))'
                      }} className="flex items-center gap-1">
                        {t('public.viewDetails', 'View')}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <BrowsePageContent />
    </Suspense>
  );
}
