'use client';

import { useState, Fragment } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AuditEvent } from '@/lib/audit/types';
import '@/styles/audit-table.css';

interface AuditEventsTableProps {
  events: AuditEvent[];
  isAdmin?: boolean;
  onEventClick?: (event: AuditEvent) => void;
  t?: (key: string, fallback: string) => string;
}

export function AuditEventsTable({ events, isAdmin = false, onEventClick, t = (_, fallback) => fallback }: AuditEventsTableProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertTriangle className={`risk-icon ${riskLevel}`} />;
      default:
        return <Shield className={`risk-icon ${riskLevel}`} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="status-icon success" />;
      case 'failure':
        return <XCircle className="status-icon failure" />;
      default:
        return <AlertTriangle className="status-icon pending" />;
    }
  };

  const getRiskBadgeStyle = (riskLevel: string) => {
    const styles = {
      critical: { backgroundColor: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 60%)' },
      high: { backgroundColor: 'hsl(25 95% 53% / 0.1)', color: 'hsl(25 95% 53%)' },
      medium: { backgroundColor: 'hsl(45 93% 47% / 0.1)', color: 'hsl(45 93% 47%)' },
      low: { backgroundColor: 'hsl(142 71% 45% / 0.1)', color: 'hsl(142 71% 45%)' },
    };
    return styles[riskLevel as keyof typeof styles] || styles.low;
  };

  const getEventTypeBadgeStyle = (eventType: string) => {
    const styles = {
      CREATE: { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' },
      READ: { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--text-body))' },
      UPDATE: { backgroundColor: 'hsl(262 83% 58% / 0.1)', color: 'hsl(262 83% 58%)' },
      DELETE: { backgroundColor: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 60%)' },
      EXPORT: { backgroundColor: 'hsl(25 95% 53% / 0.1)', color: 'hsl(25 95% 53%)' },
      IMPORT: { backgroundColor: 'hsl(142 71% 45% / 0.1)', color: 'hsl(142 71% 45%)' },
      LOGIN: { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' },
      LOGOUT: { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--text-body))' },
      ACCESS: { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--text-body))' },
    };
    return styles[eventType as keyof typeof styles] || styles.READ;
  };

  const formatDate = (dateString: string) => {
    // Parse the date - ensure proper timezone handling
    const date = new Date(dateString);

    // Use Hebrew locale for proper RTL formatting
    const dateStr = date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }); // 26/01/2026

    const timeStr = date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,  // 24-hour format for Hebrew
    }); // 15:41

    return { dateStr, timeStr };
  };

  /**
   * Format resource type with translation support
   */
  const formatResourceType = (resourceType: string): string => {
    // Try to translate the resource type first
    const translationKey = `audit.resource.${resourceType}`;
    const translated = t(translationKey, '');
    if (translated) {
      return translated;
    }

    // Fallback to formatting the resource type
    return resourceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Translate event type for display
   */
  const formatEventType = (eventType: string): string => {
    const translationKey = `audit.eventType.${eventType}`;
    return t(translationKey, eventType);
  };

  /**
   * Format field names for display (e.g., instagram_url -> Instagram URL)
   */
  const formatFieldName = (field: string): string => {
    // Try to translate the field name first
    const translationKey = `audit.field.${field}`;
    const translated = t(translationKey, '');
    if (translated) {
      return translated;
    }

    // Fallback to formatting the field name
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  /**
   * Format the action name by combining the action, resource, and changed fields
   */
  const formatActionName = (action: string, event?: AuditEvent): string => {
    // Check if this is a translation key
    if (action.startsWith('audit.')) {
      return t(action, action);
    }

    // Handle dotted actions like "profile.updated" or "lesson.created"
    if (action.includes('.')) {
      const [resourcePart, actionPart] = action.split('.');

      // Try to translate action and resource separately
      const actionKey = `audit.action.${actionPart}`;
      const resourceKey = `audit.resource.${resourcePart}`;

      const actionTranslated = t(actionKey, actionPart.charAt(0).toUpperCase() + actionPart.slice(1));
      const resourceTranslated = t(resourceKey, resourcePart.charAt(0).toUpperCase() + resourcePart.slice(1));

      return `${actionTranslated} ${resourceTranslated}`;
    }

    // Normalize action names for better readability
    return action
      .replace(/^Updated\s+/i, 'Updated ')
      .replace(/^Created\s+/i, 'Created ')
      .replace(/^Deleted\s+/i, 'Deleted ')
      .replace(/_/g, ' ')
      .split(' ')
      .map((word, index) =>
        index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
      )
      .join(' ');
  };

  const formatDescription = (event: AuditEvent): string => {
    // Check if this is a translation key
    if (event.description?.startsWith('audit.')) {
      let translated = t(event.description, event.description);

      // Replace placeholders with values from new_values
      if (event.new_values) {
        Object.entries(event.new_values).forEach(([key, value]) => {
          translated = translated.replace(`{${key}}`, String(value));
        });
      }

      return translated;
    }
    return event.description || '';
  };

  const getChangedFieldsSummary = (event: AuditEvent): string | null => {
    if (event.event_type !== 'UPDATE') {
      return null;
    }

    // Check for fields in either location
    const fieldsList = event.changed_fields || event.metadata?.fields;

    if (!fieldsList || fieldsList.length === 0) {
      return null;
    }

    const fields = fieldsList
      .map((field: string) => formatFieldName(field))
      .slice(0, 2);  // Show first 2 fields instead of 3 for cleaner display

    if (fieldsList.length > 2) {
      return `${fields.join(', ')} +${fieldsList.length - 2}`;
    }
    return fields.join(', ');
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  /**
   * Format a value for clean display (no JSON)
   */
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) {
      return t('common.empty', '(empty)');
    }
    if (typeof val === 'boolean') {
      return val ? t('common.yes', 'Yes') : t('common.no', 'No');
    }
    if (typeof val === 'string') {
      return val;
    }
    if (typeof val === 'number') {
      return String(val);
    }
    if (typeof val === 'object') {
      // For objects/arrays, show a clean summary
      if (Array.isArray(val)) {
        return val.length > 0 ? val.join(', ') : t('common.empty', '(empty)');
      }
      // For objects, show key-value pairs cleanly
      const entries = Object.entries(val);
      if (entries.length === 0) return t('common.empty', '(empty)');
      if (entries.length <= 3) {
        return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      return `${entries.length} ${t('common.items', 'items')}`;
    }
    return String(val);
  };

  const renderValueDiff = (oldVal: any, newVal: any, field: string) => {
    const oldStr = formatValue(oldVal);
    const newStr = formatValue(newVal);

    // If values are the same, don't show diff
    if (oldStr === newStr) {
      return (
        <div style={{
          fontSize: 'var(--font-size-sm)',
          fontFamily: 'var(--font-family-primary)',
          padding: '0.5rem',
          borderRadius: 'calc(var(--radius) * 1)',
          backgroundColor: 'hsl(var(--muted))',
          color: 'hsl(var(--text-body))'
        }}>
          {newStr}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3" style={{ alignItems: 'start' }}>
        <div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'hsl(var(--text-muted))',
            fontFamily: 'var(--font-family-primary)',
            marginBottom: '0.375rem'
          }}>
            {t('admin.audit.details.before', 'Before')}
          </div>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'calc(var(--radius) * 1)',
            backgroundColor: 'hsl(0 84% 60% / 0.08)',
            border: '1px solid hsl(0 84% 60% / 0.2)',
            color: 'hsl(var(--text-muted))',
            textDecoration: oldStr ? 'line-through' : 'none',
            minHeight: '2.5rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            {oldStr || t('common.empty', '(empty)')}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'hsl(142 71% 45%)',
            fontFamily: 'var(--font-family-primary)',
            marginBottom: '0.375rem'
          }}>
            {t('admin.audit.details.after', 'After')}
          </div>
          <div style={{
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)',
            padding: '0.5rem 0.75rem',
            borderRadius: 'calc(var(--radius) * 1)',
            backgroundColor: 'hsl(142 71% 45% / 0.08)',
            border: '1px solid hsl(142 71% 45% / 0.2)',
            color: 'hsl(var(--text-body))',
            fontWeight: 'var(--font-weight-medium)',
            minHeight: '2.5rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            {newStr || t('common.empty', '(empty)')}
          </div>
        </div>
      </div>
    );
  };

  if (events.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'calc(var(--radius) * 2)',
        textAlign: 'center',
        color: 'hsl(var(--text-muted))'
      }}>
        <Shield className="h-12 w-12 mb-4" style={{ color: 'hsl(var(--text-muted))' }} />
        <p style={{
          fontSize: 'var(--font-size-base)',
          fontFamily: 'var(--font-family-primary)'
        }}>
          {t('admin.audit.table.noEvents', 'No audit events found')}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'calc(var(--radius) * 2)',
      overflow: 'hidden'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{
            backgroundColor: 'hsl(var(--muted) / 0.3)',
            borderBottom: '1px solid hsl(var(--border))'
          }}>
            <tr>
              <th style={{
                padding: '0.625rem 0.75rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap'
              }}>
                {t('admin.audit.table.time', 'Time')}
              </th>
              <th style={{
                padding: '0.625rem 0.75rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.table.user', 'User')}
              </th>
              <th style={{
                padding: '0.625rem 0.75rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.table.action', 'Action')}
              </th>
              <th style={{
                padding: '0.625rem 0.75rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap'
              }}>
                {t('admin.audit.table.resource', 'Resource')}
              </th>
              <th style={{
                padding: '0.625rem 0.75rem',
                textAlign: 'center',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap'
              }}>
                {t('admin.audit.table.type', 'Type')}
              </th>
              <th style={{
                padding: '0.625rem 0.75rem',
                textAlign: 'center',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap'
              }}>
                {t('admin.audit.table.risk', 'Risk')}
              </th>
              <th style={{
                padding: '0.625rem 0.75rem',
                textAlign: 'center',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                width: '40px'
              }}></th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => (
              <Fragment key={event.id}>
                <tr
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    borderBottom: index < events.length - 1 ? '1px solid hsl(var(--border))' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => toggleExpand(event.id)}
                >
                  {/* Time */}
                  <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle', minWidth: '180px' }}>
                    <div style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: 'var(--font-size-xs)',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{
                        color: 'hsl(var(--text-body))',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: '0.125rem'
                      }}>
                        {formatDate(event.event_timestamp).timeStr}
                      </div>
                      <div style={{
                        color: 'hsl(var(--text-muted))',
                        fontSize: 'var(--font-size-xs)'
                      }}>
                        {formatDate(event.event_timestamp).dateStr}
                      </div>
                    </div>
                  </td>

                  {/* User */}
                  <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                    <div>
                      <div style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'hsl(var(--text-heading))',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '200px'
                      }}>
                        {event.user_email || t('admin.audit.table.system', 'System')}
                      </div>
                      {event.user_role && (
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'hsl(var(--text-muted))',
                          fontFamily: 'var(--font-family-primary)'
                        }}>
                          {event.user_role}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Action - CLEAN DISPLAY ONLY */}
                  <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                    <div style={{
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-body))',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)'
                    }}>
                      {formatActionName(event.action, event)}
                    </div>
                  </td>

                  {/* Resource */}
                  <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-body))',
                      fontFamily: 'var(--font-family-primary)',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatResourceType(event.resource_type)}
                    </div>
                    {event.resource_name && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        fontFamily: 'var(--font-family-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '150px'
                      }}>
                        {event.resource_name}
                      </div>
                    )}
                  </td>

                  {/* Type Badge */}
                  <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'calc(var(--radius) * 3)',
                        fontSize: '0.625rem',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontFamily: 'var(--font-family-primary)',
                        whiteSpace: 'nowrap',
                        ...getEventTypeBadgeStyle(event.event_type)
                      }}
                    >
                      {formatEventType(event.event_type)}
                    </span>
                  </td>

                  {/* Risk */}
                  <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div className="flex items-center justify-center gap-1">
                      {getRiskIcon(event.risk_level)}
                      {getStatusIcon(event.status)}
                    </div>
                  </td>

                  {/* Expand Button */}
                  <td style={{ padding: '0.625rem 0.75rem', textAlign: 'center', verticalAlign: 'middle' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(event.id);
                      }}
                      style={{
                        padding: '0.25rem',
                        borderRadius: 'calc(var(--radius) * 1)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {expandedEvent === event.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>

                {/* Expanded Details */}
                {expandedEvent === event.id && (
                  <tr>
                    <td colSpan={7} style={{
                      padding: '1rem',
                      backgroundColor: 'hsl(var(--muted) / 0.2)',
                      borderBottom: index < events.length - 1 ? '1px solid hsl(var(--border))' : 'none'
                    }}>
                      {/* Exact Changes */}
                      {event.event_type === 'UPDATE' && (() => {
                        // Check for changes in either format:
                        // 1. Dedicated columns: changed_fields, old_values, new_values
                        // 2. Metadata format: metadata.fields, metadata.changes
                        const hasChangesInColumns = event.changed_fields && event.changed_fields.length > 0 && event.old_values && event.new_values;
                        const hasChangesInMetadata = event.metadata?.fields && event.metadata?.changes;

                        if (!hasChangesInColumns && !hasChangesInMetadata) {
                          return false;
                        }

                        // Get the list of fields from either location
                        const fields = hasChangesInColumns
                          ? event.changed_fields
                          : event.metadata?.fields || [];

                        // Filter out automatic fields
                        const relevantFields = fields.filter((field: string) =>
                          field !== 'updated_at' && field !== 'created_at'
                        );

                        return relevantFields.length > 0;
                      })() && (() => {
                        // Determine which format we're using
                        const hasChangesInColumns = event.changed_fields && event.old_values && event.new_values;
                        const fields = hasChangesInColumns
                          ? event.changed_fields
                          : event.metadata?.fields || [];
                        const relevantFields = fields.filter((field: string) =>
                          field !== 'updated_at' && field !== 'created_at'
                        );

                        return (
                          <div className="space-y-2">
                            {relevantFields
                              .filter((field: string) => {
                                // Get before/after values to check if there's an actual change
                                let oldVal, newVal;
                                if (hasChangesInColumns) {
                                  oldVal = event.old_values?.[field];
                                  newVal = event.new_values?.[field];
                                } else {
                                  const change = event.metadata?.changes?.[field];
                                  oldVal = change?.before;
                                  newVal = change?.after;
                                }

                                // Filter out fields where:
                                // 1. Both values are empty/null
                                const bothEmpty = (oldVal === null || oldVal === undefined || oldVal === '') &&
                                                 (newVal === null || newVal === undefined || newVal === '');

                                // 2. Both values are the same
                                const noChange = oldVal === newVal;

                                return !bothEmpty && !noChange;
                              })
                              .map((field: string) => {
                                // Get before/after values from either location
                                let oldVal, newVal;
                                if (hasChangesInColumns) {
                                  oldVal = event.old_values?.[field];
                                  newVal = event.new_values?.[field];
                                } else {
                                  // Metadata format has { before, after }
                                  const change = event.metadata?.changes?.[field];
                                  oldVal = change?.before;
                                  newVal = change?.after;
                                }

                                return (
                                  <div key={field}>
                                    <div style={{
                                      fontSize: 'var(--font-size-sm)',
                                      fontWeight: 'var(--font-weight-semibold)',
                                      fontFamily: 'var(--font-family-primary)',
                                      color: 'hsl(var(--text-heading))',
                                      marginBottom: '0.5rem'
                                    }}>
                                      {formatFieldName(field)}
                                    </div>
                                    {renderValueDiff(oldVal, newVal, field)}
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
