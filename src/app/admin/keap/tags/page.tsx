'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  Search,
  Loader2,
  Users,
  RefreshCw
} from 'lucide-react';

interface KeapTag {
  id: number;
  name: string;
  description?: string;
  category?: {
    id: number;
    name: string;
  };
}

export default function KeapTagsPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';

  const [tags, setTags] = useState<KeapTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', description: '', categoryId: undefined as number | undefined });
  const [creating, setCreating] = useState(false);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/keap/tags');
      const result = await response.json();

      if (result.success) {
        setTags(result.data.tags || []);
      } else {
        toast.error(result.error || 'Failed to fetch tags');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to fetch tags');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/admin/keap/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || 'Tag created successfully');
        setNewTag({ name: '', description: '', categoryId: undefined });
        setShowCreateDialog(false);
        await fetchTags();
      } else {
        toast.error(result.error || 'Failed to create tag');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    } finally {
      setCreating(false);
    }
  };

  // Get unique categories with IDs
  const categoriesMap = new Map<string, number>();
  tags.forEach(tag => {
    if (tag.category) {
      categoriesMap.set(tag.category.name, tag.category.id);
    }
  });
  const categories = Array.from(categoriesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Filter tags by search and category
  const filteredTags = tags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' ||
      (categoryFilter === 'uncategorized' && !tag.category) ||
      tag.category?.name === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTags.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTags = filteredTags.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {t('admin.keap.tags.title', 'Keap Tags')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.keap.tags.pageDescription', 'Manage tags for student segmentation and automation')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchTags}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('admin.keap.tags.refresh', 'Refresh')}
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {t('admin.keap.tags.createTag', 'Create Tag')}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.keap.tags.searchPlaceholder', 'Search tags...')}
              className={`w-full ${isRtl ? 'pr-10' : 'pl-10'} py-2 border rounded-lg bg-background`}
            />
          </div>
          <div className="w-full sm:w-64">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="all">{t('admin.keap.tags.allCategories', 'All Categories')}</option>
              <option value="uncategorized">{t('admin.keap.tags.uncategorized', 'Uncategorized')}</option>
              {categories.map(([name, id]) => (
                <option key={id} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className="p-2 bg-primary/10 rounded">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t('admin.keap.tags.totalTags', 'Total Tags')}
              </div>
              <div className="text-2xl font-bold">{tags.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className="p-2 bg-blue-500/10 rounded">
              <Search className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t('admin.keap.tags.filtered', 'Filtered')}
              </div>
              <div className="text-2xl font-bold">{filteredTags.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className="p-2 bg-green-500/10 rounded">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t('admin.keap.tags.withCategory', 'With Category')}
              </div>
              <div className="text-2xl font-bold">{tags.filter(t => t.category).length}</div>
            </div>
          </div>
        </div>

        {/* Tags Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('admin.keap.tags.noTags', 'No tags found')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? t('admin.keap.tags.noSearchResults', 'Try a different search term') : t('admin.keap.tags.createFirstTag', 'Create your first tag to get started')}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                {t('admin.keap.tags.createTag', 'Create Tag')}
              </button>
            )}
          </div>
        ) : (
          <>
          <div className="border rounded-lg overflow-hidden bg-card overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className={`${isRtl ? 'text-right' : 'text-left'} px-2 sm:px-4 py-3 text-sm font-medium`}>
                    {t('admin.keap.tags.tagName', 'Tag Name')}
                  </th>
                  <th className={`${isRtl ? 'text-right' : 'text-left'} px-2 sm:px-4 py-3 text-sm font-medium hidden md:table-cell`}>
                    {t('admin.keap.tags.description', 'Description')}
                  </th>
                  <th className={`${isRtl ? 'text-right' : 'text-left'} px-2 sm:px-4 py-3 text-sm font-medium hidden sm:table-cell`}>
                    {t('admin.keap.tags.category', 'Category')}
                  </th>
                  <th className={`${isRtl ? 'text-right' : 'text-left'} px-2 sm:px-4 py-3 text-sm font-medium hidden sm:table-cell`}>
                    ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTags.map((tag, index) => (
                  <tr
                    key={tag.id}
                    className={`border-b last:border-b-0 hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                  >
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm">{tag.name}</span>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {tag.description || '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                      {tag.category ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-accent rounded-md text-xs">
                          <Users className="h-3 w-3" />
                          {tag.category.name}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground font-mono">#{tag.id}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
              <div className="text-sm text-muted-foreground">
                {t('admin.keap.tags.showing', 'Showing')} {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredTags.length)} {t('admin.keap.tags.of', 'of')} {filteredTags.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {t('admin.keap.tags.previous', 'Previous')}
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;

                    if (totalPages <= maxVisible + 2) {
                      // Show all pages if total is small
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // Always show first page
                      pages.push(1);

                      // Calculate range around current page
                      let start = Math.max(2, currentPage - 1);
                      let end = Math.min(totalPages - 1, currentPage + 1);

                      // Add ellipsis after first page if needed
                      if (start > 2) {
                        pages.push('...');
                      }

                      // Add pages around current
                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }

                      // Add ellipsis before last page if needed
                      if (end < totalPages - 1) {
                        pages.push('...');
                      }

                      // Always show last page
                      pages.push(totalPages);
                    }

                    return pages.map((page, index) =>
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          className={`px-3 py-1 border rounded text-sm ${
                            currentPage === page
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    );
                  })()}
                </div>

                {/* Mobile: show current page */}
                <div className="sm:hidden text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {t('admin.keap.tags.next', 'Next')}
                </button>
              </div>
            </div>
          )}
          </>
        )}

        {/* Create Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                {t('admin.keap.tags.createTag', 'Create Tag')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.keap.tags.tagName', 'Tag Name')} *
                  </label>
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    placeholder={t('admin.keap.tags.tagNamePlaceholder', 'e.g., LMS Student')}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.keap.tags.description', 'Description')}
                  </label>
                  <textarea
                    value={newTag.description}
                    onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                    placeholder={t('admin.keap.tags.descriptionPlaceholder', 'Brief description of this tag')}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.keap.tags.category', 'Category')}
                  </label>
                  <select
                    value={newTag.categoryId || ''}
                    onChange={(e) => setNewTag({ ...newTag, categoryId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="">{t('admin.keap.tags.noCategory', 'No Category')}</option>
                    {categories.map(([name, id]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowCreateDialog(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-accent disabled:opacity-50"
                >
                  {t('admin.keap.tags.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={creating}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('admin.keap.tags.create', 'Create')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
