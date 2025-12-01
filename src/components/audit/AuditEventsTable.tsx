'use client';

import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AuditEvent } from '@/lib/audit/types';

interface AuditEventsTableProps {
  events: AuditEvent[];
  isAdmin?: boolean;
  onEventClick?: (event: AuditEvent) => void;
  t?: (key: string, fallback: string) => string;
}

export function AuditEventsTable({ events, isAdmin = false, onEventClick, t = (_, fallback) => fallback }: AuditEventsTableProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const getRiskIcon = (riskLevel: string) => {
    const colors = {
      critical: 'hsl(0 84% 60%)',
      high: 'hsl(25 95% 53%)',
      medium: 'hsl(45 93% 47%)',
      low: 'hsl(142 71% 45%)',
    };
    const color = colors[riskLevel as keyof typeof colors] || colors.low;

    switch (riskLevel) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-3.5 w-3.5" style={{ color }} />;
      default:
        return <Shield className="h-3.5 w-3.5" style={{ color }} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(142 71% 45%)' }} />;
      case 'failure':
        return <XCircle className="h-3.5 w-3.5" style={{ color: 'hsl(0 84% 60%)' }} />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'hsl(45 93% 47%)' }} />;
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
    const now = new Date();

    // Format for display with full context
    const dateStr = date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const timeStr = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    return { dateStr, timeStr };
  };

  const formatResourceType = (resourceType: string) => {
    return resourceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatActionName = (action: string) => {
    // Check if this is a translation key
    if (action.startsWith('audit.')) {
      return t(action, action);
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
    if (event.event_type !== 'UPDATE' || !event.changed_fields || event.changed_fields.length === 0) {
      return null;
    }

    const fields = event.changed_fields
      .map(field => field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      .slice(0, 3);

    if (event.changed_fields.length > 3) {
      return `${fields.join(', ')} +${event.changed_fields.length - 3} more`;
    }
    return fields.join(', ');
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const renderValueDiff = (oldVal: any, newVal: any, field: string) => {
    const oldStr = typeof oldVal === 'object' ? JSON.stringify(oldVal, null, 2) : String(oldVal);
    const newStr = typeof newVal === 'object' ? JSON.stringify(newVal, null, 2) : String(newVal);

    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'hsl(var(--text-muted))',
            fontFamily: 'var(--font-family-primary)',
            marginBottom: '0.25rem'
          }}>
            {t('admin.audit.details.before', 'Before')}
          </div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'var(--font-family-mono)',
            padding: '0.375rem',
            borderRadius: 'calc(var(--radius) * 1)',
            backgroundColor: 'hsl(0 84% 60% / 0.05)',
            border: '1px solid hsl(0 84% 60% / 0.2)',
            textDecoration: 'line-through',
            color: 'hsl(var(--text-muted))',
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {oldStr}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'hsl(142 71% 45%)',
            fontFamily: 'var(--font-family-primary)',
            marginBottom: '0.25rem'
          }}>
            {t('admin.audit.details.after', 'After')}
          </div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'var(--font-family-mono)',
            padding: '0.375rem',
            borderRadius: 'calc(var(--radius) * 1)',
            backgroundColor: 'hsl(142 71% 45% / 0.05)',
            border: '1px solid hsl(142 71% 45% / 0.2)',
            color: 'hsl(var(--text-body))',
            fontWeight: 'var(--font-weight-medium)',
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {newStr}
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
              <>
                <tr
                  key={event.id}
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

                  {/* Action */}
                  <td style={{ padding: '0.625rem 0.75rem', verticalAlign: 'middle' }}>
                    <div style={{
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-body))',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)'
                    }}>
                      {formatActionName(event.action)}
                    </div>
                    {getChangedFieldsSummary(event) ? (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--primary))',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginTop: '0.125rem'
                      }}>
                        {t('admin.audit.table.changed', 'Changed')}: {getChangedFieldsSummary(event)}
                      </div>
                    ) : formatDescription(event) && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        fontFamily: 'var(--font-family-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '250px'
                      }}>
                        {formatDescription(event)}
                      </div>
                    )}
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
                        fontFamily: 'var(--font-family-mono)',
                        whiteSpace: 'nowrap',
                        ...getEventTypeBadgeStyle(event.event_type)
                      }}
                    >
                      {event.event_type}
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
                      {event.event_type === 'UPDATE' && event.changed_fields && event.changed_fields.length > 0 && event.old_values && event.new_values && (() => {
                        // Filter out automatic fields that aren't relevant to display
                        const relevantFields = event.changed_fields.filter(field =>
                          field !== 'updated_at' && field !== 'created_at'
                        );
                        return relevantFields.length > 0;
                      })() && (
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            fontFamily: 'var(--font-family-primary)',
                            color: 'hsl(var(--text-heading))',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <AlertTriangle className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
                            {t('admin.audit.details.exactChanges', 'Exact Changes')} ({event.changed_fields.filter(f => f !== 'updated_at' && f !== 'created_at').length})
                          </div>
                          <div className="space-y-2">
                            {event.changed_fields
                              .filter(field => field !== 'updated_at' && field !== 'created_at')
                              .map((field) => (
                              <div key={field}>
                                <div style={{
                                  fontSize: 'var(--font-size-xs)',
                                  fontWeight: 'var(--font-weight-semibold)',
                                  fontFamily: 'var(--font-family-mono)',
                                  color: 'hsl(var(--primary))',
                                  marginBottom: '0.25rem',
                                  textTransform: 'uppercase'
                                }}>
                                  {field}
                                </div>
                                {renderValueDiff(event.old_values?.[field], event.new_values?.[field], field)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span style={{ color: 'hsl(var(--text-muted))' }}>ID:</span>{' '}
                          <span style={{ fontFamily: 'var(--font-family-mono)' }}>{event.id.slice(0, 8)}...</span>
                        </div>
                        <div>
                          <span style={{ color: 'hsl(var(--text-muted))' }}>Category:</span>{' '}
                          {event.event_category}
                        </div>
                        {event.ip_address && (
                          <div>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>IP:</span>{' '}
                            <span style={{ fontFamily: 'var(--font-family-mono)' }}>{event.ip_address}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
