'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, FileSignature, Info, Loader2, Search, Tag, X } from 'lucide-react';

interface DocuSignConfigProps {
  requiresSignature: boolean;
  onRequiresSignatureChange: (required: boolean) => void;
  signatureTemplateId?: string;
  onSignatureTemplateIdChange: (templateId: string) => void;
  crmTagSlugs?: string[];
  onCrmTagSlugsChange: (slugs: string[]) => void;
  direction?: 'ltr' | 'rtl';
  t: (key: string, fallback: string) => string;
}

interface DocuSignTemplate {
  templateId: string;
  name: string;
}

// Mirrors the shape returned by IParentingSchool's GET /api/admin/crm/tags
// (proxied via /api/admin/crm/tags on IPSPlatform).
interface CrmTag {
  id: string;
  slug: string;
  label_he: string | null;
  label_en: string | null;
  category: { id: string; name: string; color: string | null } | null;
}

export function DocuSignConfig({
  requiresSignature,
  onRequiresSignatureChange,
  signatureTemplateId,
  onSignatureTemplateIdChange,
  crmTagSlugs = [],
  onCrmTagSlugsChange,
  direction = 'ltr',
  t,
}: DocuSignConfigProps) {
  const isRtl = direction === 'rtl';
  const [templates, setTemplates] = useState<DocuSignTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  // CRM (IParentingSchool) tag picker state
  const [crmTags, setCrmTags] = useState<CrmTag[]>([]);
  const [loadingCrmTags, setLoadingCrmTags] = useState(false);
  const [crmTagsError, setCrmTagsError] = useState<string | null>(null);
  const [crmTagSearch, setCrmTagSearch] = useState('');

  // Fetch DocuSign templates
  useEffect(() => {
    if (requiresSignature) {
      fetchTemplates();
    }
  }, [requiresSignature]);

  // Fetch CRM tag taxonomy (proxied to IParentingSchool)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoadingCrmTags(true);
        setCrmTagsError(null);
        const response = await fetch('/api/admin/crm/tags');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || `HTTP ${response.status}`);
        }
        if (!cancelled) setCrmTags(result.tags || []);
      } catch (e) {
        if (!cancelled) {
          setCrmTagsError(e instanceof Error ? e.message : 'Failed to load CRM tags');
        }
      } finally {
        if (!cancelled) setLoadingCrmTags(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      setTemplatesError(null);
      const response = await fetch('/api/admin/docusign/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');

      const result = await response.json();
      if (result.success && result.templates) {
        setTemplates(result.templates);
      } else {
        setTemplatesError(result.message || 'No templates available');
      }
    } catch (error) {
      console.error('Error fetching DocuSign templates:', error);
      setTemplatesError(error instanceof Error ? error.message : 'Failed to fetch templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Label resolution mirrors IParentingSchool's CrmTagPicker: prefer
  // Hebrew, then English, then the slug as a last resort.
  const crmLabelOf = (tag: CrmTag) =>
    tag.label_he?.trim() || tag.label_en?.trim() || tag.slug;

  const filteredCrmTags = useMemo(() => {
    const q = crmTagSearch.trim().toLowerCase();
    if (!q) return crmTags;
    return crmTags.filter(
      (tag) =>
        crmLabelOf(tag).toLowerCase().includes(q) ||
        tag.slug.toLowerCase().includes(q) ||
        (tag.category?.name ?? '').toLowerCase().includes(q),
    );
  }, [crmTags, crmTagSearch]);

  const selectedCrmTags = useMemo(
    () => crmTags.filter((tag) => crmTagSlugs.includes(tag.slug)),
    [crmTags, crmTagSlugs],
  );

  const toggleCrmTag = (slug: string) => {
    const next = crmTagSlugs.includes(slug)
      ? crmTagSlugs.filter((s) => s !== slug)
      : [...crmTagSlugs, slug];
    onCrmTagSlugsChange(next);
  };

  return (
    <div className="space-y-6">
      {/* DocuSign Signature Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="h-4 w-4" />
            {t('products.docusign.title', 'DocuSign Integration')}
          </CardTitle>
          <CardDescription>
            {t('products.docusign.description', 'Require electronic signature before enrollment completion')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requires_signature">
                {t('products.docusign.require_signature', 'Require Signature')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('products.docusign.require_signature_desc', 'Students must sign a document via DocuSign to complete enrollment')}
              </p>
            </div>
            <Switch
              id="requires_signature"
              checked={requiresSignature}
              onCheckedChange={onRequiresSignatureChange}
            />
          </div>

          {requiresSignature && (
            <>
              <div>
                <Label htmlFor="signature_template_id">
                  {t('products.docusign.template', 'DocuSign Template')} *
                </Label>
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : templatesError ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{templatesError}</AlertDescription>
                  </Alert>
                ) : (
                  <Select
                    value={signatureTemplateId || ''}
                    onValueChange={onSignatureTemplateIdChange}
                  >
                    <SelectTrigger id="signature_template_id">
                      <SelectValue placeholder={t('products.docusign.select_template', 'Select a template...')} />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.length === 0 && (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          {t('products.docusign.no_templates', 'No templates available')}
                        </div>
                      )}
                      {templates.map((template) => (
                        <SelectItem key={template.templateId} value={template.templateId}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {t('products.docusign.template_desc', 'Select the DocuSign template to use for this product')}
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('products.docusign.info', 'When a user enrolls in this product, they will receive a DocuSign envelope to complete before their enrollment is finalized.')}
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* CRM Tag Configuration (IParentingSchool CRM) */}
      <Card dir={direction}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t('products.crm.title', 'CRM Tags')}
          </CardTitle>
          <CardDescription>
            {t(
              'products.crm.description',
              'Tags applied to the buyer’s CRM contact when they complete enrollment in this product.',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingCrmTags ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : crmTagsError ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{crmTagsError}</AlertDescription>
            </Alert>
          ) : (
            <>
              {selectedCrmTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCrmTags.map((tag) => {
                    const color = tag.category?.color ?? null;
                    return (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: color ? `${color}22` : undefined,
                          color: color ?? undefined,
                          border: color
                            ? `1px solid ${color}55`
                            : '1px solid var(--border)',
                        }}
                      >
                        {crmLabelOf(tag)}
                        <button
                          type="button"
                          onClick={() => toggleCrmTag(tag.slug)}
                          aria-label={`Remove ${crmLabelOf(tag)}`}
                          className="hover:bg-black/10 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="border border-border rounded-md bg-card">
                <div className="relative border-b border-border">
                  <Search
                    className={`absolute ${
                      isRtl ? 'right-3' : 'left-3'
                    } top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none`}
                  />
                  <input
                    type="search"
                    value={crmTagSearch}
                    onChange={(e) => setCrmTagSearch(e.target.value)}
                    placeholder={t('products.crm.search', 'Search CRM tags…')}
                    className={`w-full h-9 bg-transparent text-sm focus:outline-none ${
                      isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                    }`}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCrmTags.length === 0 ? (
                    <p
                      className={`p-4 text-xs text-muted-foreground ${
                        isRtl ? 'text-right' : 'text-left'
                      }`}
                    >
                      {crmTagSearch.trim()
                        ? t('products.crm.none_found', 'No CRM tags found.')
                        : t('products.crm.none_available', 'No CRM tags available.')}
                    </p>
                  ) : (
                    <ul>
                      {filteredCrmTags.map((tag) => {
                        const checked = crmTagSlugs.includes(tag.slug);
                        const color = tag.category?.color ?? null;
                        return (
                          <li key={tag.id}>
                            <button
                              type="button"
                              onClick={() => toggleCrmTag(tag.slug)}
                              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted ${
                                isRtl ? 'text-right' : 'text-left'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  checked
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-border'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3" strokeWidth={3} />}
                              </span>
                              {color && (
                                <span
                                  aria-hidden
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                              )}
                              <span className="flex-1 truncate">{crmLabelOf(tag)}</span>
                              {tag.category && (
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {tag.category.name}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
              {crmTags.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {crmTags.length}{' '}
                  {t('products.crm.tags_available', 'CRM tags available')}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
