'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen,
  Users,
  Clock,
  Search,
  X,
  LayoutGrid,
  List,
  PlayCircle,
  AlertCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUserLanguage } from '@/context/AppContext';
import { PublicHeader } from '@/components/public/index';
import { PublicFooter } from '@/components/public/index';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  title: string;
  description: string;
  image_url: string;
  product_type: 'program' | 'course';
  payment_model: string;
  price?: number;
  currency?: string;
  total_lessons: number;
  total_hours: number;
  student_count: number;
  instructor?: string | null;
}

export default function CoursesPage() {
  const { t, direction } = useUserLanguage();
  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<Product[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    setMounted(true);
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      applyFilters();
    }
  }, [searchQuery, priceFilter, sortBy, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/public/products?type=course&limit=100');

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();

      if (data.success && data.products) {
        setCourses(data.products);
        setFilteredCourses(data.products);
      } else {
        setCourses([]);
        setFilteredCourses([]);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          stripHtml(course.description).toLowerCase().includes(query) ||
          (course.instructor && course.instructor.toLowerCase().includes(query))
      );
    }

    // Price filter
    if (priceFilter !== 'all') {
      if (priceFilter === 'free') {
        filtered = filtered.filter((c) => c.payment_model === 'free');
      } else if (priceFilter === 'paid') {
        filtered = filtered.filter((c) => c.payment_model !== 'free');
      }
    }

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => b.student_count - a.student_count);
    } else if (sortBy === 'newest') {
      // Already in newest order from API
    }

    setFilteredCourses(filtered);
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const formatPrice = (product: Product) => {
    if (product.payment_model === 'free') {
      return (
        <Badge className="bg-green-600 hover:bg-green-700 text-white">
          {t('public.products.free', 'Free')}
        </Badge>
      );
    }

    if (product.price && product.currency) {
      return (
        <Badge className="bg-background/95 border border-border text-foreground hover:bg-background">
          <span dir="ltr">
            {product.currency} {product.price.toFixed(2)}
          </span>
        </Badge>
      );
    }

    return null;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriceFilter('all');
    setSortBy('newest');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={direction} suppressHydrationWarning>
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {t('browse.courses.badge', 'All Courses')}
              </span>
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              {t('browse.courses.title', 'Browse All Courses')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('browse.courses.subtitle', 'Discover courses taught by expert instructors')}
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b bg-muted/30 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${direction === 'rtl' ? 'right-3' : 'left-3'}`} />
              <Input
                type="text"
                placeholder={t('browse.search.courses', 'Search courses...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={direction === 'rtl' ? 'pr-10' : 'pl-10'}
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Price Filter */}
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('browse.price', 'Price')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('browse.price.all', 'All Prices')}</SelectItem>
                  <SelectItem value="free">{t('browse.price.free', 'Free')}</SelectItem>
                  <SelectItem value="paid">{t('browse.price.paid', 'Paid')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('browse.sort', 'Sort by')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t('browse.sort.newest', 'Newest')}</SelectItem>
                  <SelectItem value="popular">{t('browse.sort.popular', 'Most Popular')}</SelectItem>
                  <SelectItem value="price-low">{t('browse.sort.priceLow', 'Price: Low to High')}</SelectItem>
                  <SelectItem value="price-high">{t('browse.sort.priceHigh', 'Price: High to Low')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {(searchQuery || priceFilter !== 'all' || sortBy !== 'newest') && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  {t('browse.clear', 'Clear')}
                </Button>
              )}

              {/* View Toggle */}
              <div className="flex gap-1 border rounded-md">
                <Button
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('grid')}
                  className="rounded-r-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            {t('browse.showing', 'Showing')} <span className="font-semibold text-foreground">{filteredCourses.length}</span> {t('browse.of', 'of')} <span className="font-semibold text-foreground">{courses.length}</span> {t('browse.courses', 'courses')}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className={view === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className={view === 'grid' ? '' : 'flex flex-col md:flex-row'}>
                    <div className={`bg-muted animate-pulse ${view === 'grid' ? 'h-56' : 'h-48 md:h-auto md:w-64 flex-shrink-0'}`} />
                    <div className="p-6 flex-1 space-y-3">
                      <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                      <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                      <div className="flex gap-3 mt-4">
                        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('browse.error.title', 'Failed to Load Courses')}</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={fetchCourses}>
                {t('browse.error.retry', 'Try Again')}
              </Button>
            </Card>
          ) : filteredCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('browse.noResults.title', 'No Courses Found')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('browse.noResults.description', 'Try adjusting your filters or search query')}
              </p>
              <Button onClick={clearFilters} variant="outline">
                {t('browse.noResults.clear', 'Clear Filters')}
              </Button>
            </Card>
          ) : (
            <div className={view === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
              {filteredCourses.map((course) => (
                <Link key={course.id} href={`/course/${course.id}`}>
                  <Card className={`group overflow-hidden border-2 transition-all hover:border-primary hover:shadow-xl ${view === 'list' ? 'flex flex-col md:flex-row' : 'h-full'}`}>
                    <div className={`relative overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 ${view === 'grid' ? 'h-56' : 'h-48 md:h-auto md:w-64 flex-shrink-0'}`}>
                      <Image
                        src={course.image_url}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground">
                            {t('public.courses.course', 'Course')}
                          </div>
                          {course.instructor && (
                            <div className="flex items-center gap-2 text-white">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <Users className="h-3 w-3" />
                              </div>
                              <span className="text-xs font-medium">{course.instructor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        {formatPrice(course)}
                      </div>
                    </div>
                    <div className="p-6 flex-1">
                      <h3 className={`mb-3 font-bold text-foreground transition-colors group-hover:text-primary ${view === 'grid' ? 'line-clamp-2 text-xl' : 'text-2xl'}`}>
                        {course.title}
                      </h3>
                      <p className={`mb-4 text-sm text-muted-foreground ${view === 'grid' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                        {stripHtml(course.description)}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {course.total_lessons > 0 && (
                          <div className="flex items-center gap-1.5">
                            <PlayCircle className="h-4 w-4" />
                            <span className="font-medium">
                              {course.total_lessons} {t('public.courses.lessons', 'lessons')}
                            </span>
                          </div>
                        )}
                        {course.total_hours > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">
                              {course.total_hours} {t('public.courses.hours', 'hours')}
                            </span>
                          </div>
                        )}
                        {course.student_count > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{course.student_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
