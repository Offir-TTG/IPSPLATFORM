'use client';

import { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
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
        return <AlertTriangle className="h-4 w-4" style={{ color }} />;
      default:
        return <Shield className="h-4 w-4" style={{ color }} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" style={{ color: 'hsl(142 71% 45%)' }} />;
      case 'failure':
        return <XCircle className="h-4 w-4" style={{ color: 'hsl(0 84% 60%)' }} />;
      default:
        return <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(45 93% 47%)' }} />;
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
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // If less than 1 hour ago, show "X mins ago"
    if (diffMins < 60) {
      return diffMins < 1 ? 'Just now' : `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    }
    // If less than 24 hours ago, show "X hours ago"
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
    // If less than 7 days ago, show "X days ago"
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    // Otherwise show full date
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatResourceType = (resourceType: string) => {
    // Normalize resource type display
    return resourceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  // Helper to render changed value with highlighting
  const renderValueDiff = (oldVal: any, newVal: any, field: string) => {
    const oldStr = typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal);
    const newStr = typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal);

    return (
      <div className="space-y-1">
        <div style={{
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'var(--font-family-mono)',
          padding: '0.5rem',
          borderRadius: 'calc(var(--radius) * 1)',
          backgroundColor: 'hsl(0 84% 60% / 0.05)',
          border: '1px solid hsl(0 84% 60% / 0.2)',
          textDecoration: 'line-through',
          color: 'hsl(var(--text-muted))'
        }}>
          {oldStr}
        </div>
        <div style={{
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'var(--font-family-mono)',
          padding: '0.5rem',
          borderRadius: 'calc(var(--radius) * 1)',
          backgroundColor: 'hsl(142 71% 45% / 0.05)',
          border: '1px solid hsl(142 71% 45% / 0.2)',
          color: 'hsl(var(--text-body))',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          {newStr}
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
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          style={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'calc(var(--radius) * 2)',
            overflow: 'hidden',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)';
            e.currentTarget.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--border))';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => toggleExpand(event.id)}
        >
          {/* Main Content */}
          <div style={{ padding: '1.25rem' }}>
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4 mb-3">
              {/* Left: User & Action */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <User className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                  <div>
                    <div style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'hsl(var(--text-heading))',
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)'
                    }}>
                      {event.user_email || t('admin.audit.table.system', 'System')}
                    </div>
                    {event.user_role && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        fontFamily: 'var(--font-family-primary)',
                        marginTop: '0.125rem'
                      }}>{event.user_role}</div>
                    )}
                  </div>
                </div>
                <div style={{
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'hsl(var(--text-body))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  marginLeft: '2rem'
                }}>
                  {event.action}
                  {event.description && (
                    <span style={{
                      color: 'hsl(var(--text-muted))',
                      fontWeight: 'var(--font-weight-normal)',
                      marginLeft: '0.5rem'
                    }}>
                      • {event.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.375rem 0.75rem',
                    borderRadius: 'calc(var(--radius) * 4)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontFamily: 'var(--font-family-mono)',
                    ...getEventTypeBadgeStyle(event.event_type)
                  }}
                >
                  {event.event_type}
                </span>
                <div className="flex items-center gap-1.5">
                  {getRiskIcon(event.risk_level)}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.375rem 0.75rem',
                      borderRadius: 'calc(var(--radius) * 4)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-family-primary)',
                      textTransform: 'capitalize',
                      ...getRiskBadgeStyle(event.risk_level)
                    }}
                  >
                    {event.risk_level}
                  </span>
                </div>
                {getStatusIcon(event.status)}
              </div>
            </div>

            {/* Info Row */}
            <div className="flex items-center gap-6 text-sm" style={{
              paddingTop: '0.75rem',
              borderTop: '1px solid hsl(var(--border))',
              marginLeft: '2rem'
            }}>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" style={{ color: 'hsl(var(--text-muted))' }} />
                <span style={{
                  fontFamily: 'var(--font-family-mono)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'hsl(var(--text-muted))'
                }}>{formatDate(event.event_timestamp)}</span>
              </div>

              {event.resource_type && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'hsl(var(--text-muted))'
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-muted))'
                  }}>
                    {formatResourceType(event.resource_type)}
                    {event.resource_name && ` • ${event.resource_name}`}
                  </span>
                </div>
              )}

              {event.ip_address && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: 'hsl(var(--text-muted))'
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-muted))'
                  }}>
                    {event.ip_address}
                  </span>
                </div>
              )}

              <div className="ml-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(event.id);
                  }}
                  style={{
                    padding: '0.25rem',
                    borderRadius: 'calc(var(--radius) * 1)',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-muted))',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                    e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                    e.currentTarget.style.color = 'hsl(var(--primary))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    e.currentTarget.style.color = 'hsl(var(--text-muted))';
                  }}
                >
                  {expandedEvent === event.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedEvent === event.id && (
            <div style={{
              borderTop: '1px solid hsl(var(--border))',
              backgroundColor: 'hsl(var(--muted) / 0.2)',
              padding: '1.25rem'
            }}>
              {/* Exact Changes - Show field-by-field diff */}
              {event.event_type === 'UPDATE' && event.changed_fields && event.changed_fields.length > 0 && event.old_values && event.new_values && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
                    {t('admin.audit.details.exactChanges', 'Exact Changes')} ({event.changed_fields.length} fields)
                  </div>
                  <div className="space-y-3">
                    {event.changed_fields.map((field) => (
                      <div key={field} style={{
                        padding: '0.75rem',
                        backgroundColor: 'hsl(var(--card))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        border: '1px solid hsl(var(--border))'
                      }}>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          fontFamily: 'var(--font-family-mono)',
                          color: 'hsl(var(--primary))',
                          marginBottom: '0.5rem',
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Event Details */}
                <div>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.75rem'
                  }}>
                    {t('admin.audit.details.eventDetails', 'Event Details')}
                  </div>
                  <div className="space-y-2">
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-body))'
                    }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>{t('admin.audit.details.id', 'ID')}:</span>{' '}
                      <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>
                        {event.id.slice(0, 8)}...
                      </span>
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-body))'
                    }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>{t('admin.audit.details.category', 'Category')}:</span>{' '}
                      {event.event_category}
                    </div>
                    {event.session_id && (
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-body))'
                      }}>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>{t('admin.audit.details.session', 'Session')}:</span>{' '}
                        <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: 'var(--font-size-xs)' }}>
                          {event.session_id.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Network Info */}
                {(event.ip_address || event.user_agent) && (
                  <div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-heading))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.75rem'
                    }}>
                      {t('admin.audit.details.network', 'Network')}
                    </div>
                    <div className="space-y-2">
                      {event.ip_address && (
                        <div style={{
                          fontSize: 'var(--font-size-sm)',
                          fontFamily: 'var(--font-family-primary)',
                          color: 'hsl(var(--text-body))'
                        }}>
                          <span style={{ color: 'hsl(var(--text-muted))' }}>{t('admin.audit.details.ip', 'IP')}:</span>{' '}
                          <span style={{ fontFamily: 'var(--font-family-mono)' }}>{event.ip_address}</span>
                        </div>
                      )}
                      {event.user_agent && (
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          fontFamily: 'var(--font-family-mono)',
                          color: 'hsl(var(--text-muted))',
                          wordBreak: 'break-all',
                          lineHeight: '1.4'
                        }}>
                          {event.user_agent.slice(0, 80)}...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Compliance */}
                {event.compliance_flags && event.compliance_flags.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-heading))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.75rem'
                    }}>
                      {t('admin.audit.details.compliance', 'Compliance')}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {event.compliance_flags.map((flag) => (
                        <span
                          key={flag}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.25rem 0.625rem',
                            borderRadius: 'calc(var(--radius) * 3)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            fontFamily: 'var(--font-family-primary)',
                            backgroundColor: 'hsl(262 83% 58% / 0.1)',
                            color: 'hsl(262 83% 58%)'
                          }}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                    {(event.is_student_record || event.is_minor_data) && (
                      <div className="mt-3 space-y-1">
                        {event.is_student_record && (
                          <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'hsl(var(--warning))',
                            fontFamily: 'var(--font-family-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}>
                            <AlertTriangle className="h-3 w-3" />
                            {t('admin.audit.details.studentRecord', 'Student Record (FERPA Protected)')}
                          </div>
                        )}
                        {event.is_minor_data && (
                          <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'hsl(var(--warning))',
                            fontFamily: 'var(--font-family-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}>
                            <AlertTriangle className="h-3 w-3" />
                            {t('admin.audit.details.minorData', 'Minor Data (COPPA Applicable)')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
