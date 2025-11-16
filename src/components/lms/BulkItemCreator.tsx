'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface BulkItemConfig {
  count: number;
  titlePattern: string;
  descriptionTemplate?: string;
  additionalFields?: Record<string, any>;
}

export interface BulkItemPreview {
  order: number;
  title: string;
  description?: string;
  [key: string]: any;
}

export interface BulkItemCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'module' | 'lesson' | 'topic';
  onConfirm: (config: BulkItemConfig) => Promise<void>;
  maxCount?: number;
  startingOrder?: number;
  additionalFields?: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select' | 'datetime-local';
    options?: { label: string; value: any }[];
    defaultValue?: any;
    required?: boolean;
  }[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkItemCreator({
  open,
  onOpenChange,
  itemType,
  onConfirm,
  maxCount = 50,
  startingOrder = 1,
  additionalFields = [],
}: BulkItemCreatorProps) {
  const [count, setCount] = useState<number>(10);
  const [titlePattern, setTitlePattern] = useState<string>(`${capitalize(itemType)} {n}`);
  const [descriptionTemplate, setDescriptionTemplate] = useState<string>('');
  const [additionalFieldValues, setAdditionalFieldValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate previews
  const previews: BulkItemPreview[] = React.useMemo(() => {
    const items: BulkItemPreview[] = [];
    for (let i = 0; i < Math.min(count, 5); i++) {
      const n = startingOrder + i;
      items.push({
        order: n,
        title: titlePattern.replace(/\{n\}/g, n.toString()),
        description: descriptionTemplate
          ? descriptionTemplate.replace(/\{n\}/g, n.toString())
          : undefined,
        ...additionalFieldValues,
      });
    }
    return items;
  }, [count, titlePattern, descriptionTemplate, additionalFieldValues, startingOrder]);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (count < 1) {
      setError('Count must be at least 1');
      return;
    }

    if (count > maxCount) {
      setError(`Count cannot exceed ${maxCount}`);
      return;
    }

    if (!titlePattern.trim()) {
      setError('Title pattern is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm({
        count,
        titlePattern,
        descriptionTemplate: descriptionTemplate || undefined,
        additionalFields: additionalFieldValues,
      });

      // Reset form
      setCount(10);
      setTitlePattern(`${capitalize(itemType)} {n}`);
      setDescriptionTemplate('');
      setAdditionalFieldValues({});
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create items');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Bulk Create {capitalize(itemType)}s
          </DialogTitle>
          <DialogDescription>
            Create multiple {itemType}s at once using a naming pattern.
            Use {'{n}'} in your pattern to insert sequential numbers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Count Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Number of {itemType}s to create
            </label>
            <input
              type="number"
              min="1"
              max={maxCount}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className={cn(
                'w-full px-3 py-2 border rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
            <p className="text-xs text-muted-foreground">
              Maximum: {maxCount} {itemType}s
            </p>
          </div>

          {/* Title Pattern */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Title Pattern
            </label>
            <input
              type="text"
              value={titlePattern}
              onChange={(e) => setTitlePattern(e.target.value)}
              placeholder={`${capitalize(itemType)} {n}`}
              className={cn(
                'w-full px-3 py-2 border rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
            <p className="text-xs text-muted-foreground">
              Use {'{n}'} to insert sequential numbers starting from {startingOrder}
            </p>
          </div>

          {/* Description Template */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description Template (Optional)
            </label>
            <textarea
              value={descriptionTemplate}
              onChange={(e) => setDescriptionTemplate(e.target.value)}
              placeholder={`Description for ${itemType} {n}`}
              rows={3}
              className={cn(
                'w-full px-3 py-2 border rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            />
          </div>

          {/* Additional Fields */}
          {additionalFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="text-sm font-medium">{field.label}</label>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={additionalFieldValues[field.name] || field.defaultValue || ''}
                  onChange={(e) =>
                    setAdditionalFieldValues({
                      ...additionalFieldValues,
                      [field.name]: e.target.value,
                    })
                  }
                  className={cn(
                    'w-full px-3 py-2 border rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                />
              )}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={additionalFieldValues[field.name] || field.defaultValue || 0}
                  onChange={(e) =>
                    setAdditionalFieldValues({
                      ...additionalFieldValues,
                      [field.name]: parseInt(e.target.value) || 0,
                    })
                  }
                  className={cn(
                    'w-full px-3 py-2 border rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                />
              )}
              {field.type === 'boolean' && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={additionalFieldValues[field.name] || field.defaultValue || false}
                    onChange={(e) =>
                      setAdditionalFieldValues({
                        ...additionalFieldValues,
                        [field.name]: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Enable</span>
                </label>
              )}
              {field.type === 'datetime-local' && (
                <input
                  type="datetime-local"
                  value={additionalFieldValues[field.name] || field.defaultValue || ''}
                  onChange={(e) =>
                    setAdditionalFieldValues({
                      ...additionalFieldValues,
                      [field.name]: e.target.value,
                    })
                  }
                  className={cn(
                    'w-full px-3 py-2 border rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                />
              )}
              {field.type === 'select' && field.options && (
                <select
                  value={additionalFieldValues[field.name] || field.defaultValue || ''}
                  onChange={(e) =>
                    setAdditionalFieldValues({
                      ...additionalFieldValues,
                      [field.name]: e.target.value,
                    })
                  }
                  className={cn(
                    'w-full px-3 py-2 border rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}

          {/* Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Preview</label>
              <span className="text-xs text-muted-foreground">
                Showing first {Math.min(count, 5)} of {count}
              </span>
            </div>

            <div className="space-y-2">
              {previews.map((preview, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground mt-0.5">
                        #{preview.order}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{preview.title}</p>
                        {preview.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {preview.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {count > 5 && (
                <p className="text-xs text-center text-muted-foreground">
                  ... and {count - 5} more
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Creating {count} {itemType}s...</>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create {count} {capitalize(itemType)}s
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// EXPORT
// ============================================================================

export default BulkItemCreator;
