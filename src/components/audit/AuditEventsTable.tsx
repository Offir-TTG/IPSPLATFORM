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
  FileText,
  ChevronDown,
  ChevronUp,
  FolderOpen,
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
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
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
        <FileText className="h-12 w-12 mb-4" style={{ color: 'currentColor', stroke: 'currentColor' }} />
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
        <table style={{ width: '100%' }}>
          <thead style={{
            backgroundColor: 'hsl(var(--muted) / 0.3)',
            borderBottom: '1px solid hsl(var(--border))'
          }}>
            <tr>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.table.time', 'Time')}
              </th>
              <th style={{
                padding: '0.75rem 1rem',
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
                padding: '0.75rem 1rem',
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
                padding: '0.75rem 1rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.table.resource', 'Resource')}
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.table.type', 'Type')}
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.table.risk', 'Risk')}
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.table.status', 'Status')}
              </th>
              <th style={{
                padding: '0.75rem 1rem',
                textAlign: 'center',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('admin.audit.table.details', 'Details')}
              </th>
            </tr>
          </thead>
          <tbody style={{
            borderTop: '1px solid hsl(var(--border))'
          }}>
            {events.map((event) => (
              <>
                <tr
                  key={event.id}
                  style={{
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--accent))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => toggleExpand(event.id)}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                      <span style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-body))'
                      }}>{formatDate(event.event_timestamp)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                      <div>
                        <div style={{
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'hsl(var(--text-heading))',
                          fontSize: 'var(--font-size-sm)',
                          fontFamily: 'var(--font-family-primary)'
                        }}>
                          {event.user_email || t('admin.audit.table.system', 'System')}
                        </div>
                        {event.user_role && (
                          <div style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'hsl(var(--text-muted))',
                            fontFamily: 'var(--font-family-primary)',
                            marginTop: '0.25rem'
                          }}>{event.user_role}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)'
                    }}>{event.action}</div>
                    {event.description && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        fontFamily: 'var(--font-family-primary)',
                        marginTop: '0.25rem'
                      }} className="line-clamp-1">
                        {event.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-body))'
                    }}>
                      {event.resource_type}
                    </div>
                    {event.resource_name && (
                      <div style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-muted))',
                        fontFamily: 'var(--font-family-primary)',
                        marginTop: '0.25rem'
                      }}>{event.resource_name}</div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 'calc(var(--radius) * 4)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        fontFamily: 'var(--font-family-primary)',
                        ...getEventTypeBadgeStyle(event.event_type)
                      }}
                    >
                      {event.event_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div className="flex items-center gap-2">
                      {getRiskIcon(event.risk_level)}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.75rem',
                          borderRadius: 'calc(var(--radius) * 4)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)',
                          fontFamily: 'var(--font-family-primary)',
                          textTransform: 'capitalize',
                          ...getRiskBadgeStyle(event.risk_level)
                        }}
                      >
                        {event.risk_level}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(event.status)}
                      <span style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-body))',
                        textTransform: 'capitalize'
                      }}>{event.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(event.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {expandedEvent === event.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </td>
                </tr>

                {/* Expanded details */}
                {expandedEvent === event.id && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 bg-gray-50 dark:bg-gray-900">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {/* Event Details */}
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            {t('admin.audit.details.eventDetails', 'Event Details')}
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="text-gray-500">{t('admin.audit.details.id', 'ID')}:</span> {event.id.slice(0, 8)}...
                            </div>
                            <div className="text-gray-700 dark:text-gray-300">
                              <span className="text-gray-500">{t('admin.audit.details.category', 'Category')}:</span> {event.event_category}
                            </div>
                            {event.session_id && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="text-gray-500">{t('admin.audit.details.session', 'Session')}:</span> {event.session_id.slice(0, 8)}
...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Network Info */}
                        {(event.ip_address || event.user_agent) && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                              {t('admin.audit.details.network', 'Network')}
                            </div>
                            <div className="space-y-1">
                              {event.ip_address && (
                                <div className="text-gray-700 dark:text-gray-300">
                                  <span className="text-gray-500">{t('admin.audit.details.ip', 'IP')}:</span> {event.ip_address}
                                </div>
                              )}
                              {event.user_agent && (
                                <div className="text-gray-700 dark:text-gray-300 text-xs break-all">
                                  <span className="text-gray-500">{t('admin.audit.details.agent', 'Agent')}:</span> {event.user_agent.slice(0, 50)}...
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Compliance */}
                        {event.compliance_flags && event.compliance_flags.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                              {t('admin.audit.details.compliance', 'Compliance')}
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {event.compliance_flags.map((flag) => (
                                <span
                                  key={flag}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                            {event.is_student_record && (
                              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ {t('admin.audit.details.studentRecord', 'Student Record (FERPA Protected)')}
                              </div>
                            )}
                            {event.is_minor_data && (
                              <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                ⚠️ {t('admin.audit.details.minorData', 'Minor Data (COPPA Applicable)')}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Changes (if UPDATE) */}
                        {event.event_type === 'UPDATE' && (event.old_values || event.new_values) && (
                          <div className="col-span-2 md:col-span-4">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                              {t('admin.audit.details.changes', 'Changes')}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              {event.old_values && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">{t('admin.audit.details.before', 'Before')}:</div>
                                  <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                                    {JSON.stringify(event.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {event.new_values && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">{t('admin.audit.details.after', 'After')}:</div>
                                  <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                                    {JSON.stringify(event.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                            {event.changed_fields && event.changed_fields.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">{t('admin.audit.details.changedFields', 'Changed fields')}:</span>{' '}
                                <span className="text-xs text-gray-700 dark:text-gray-300">
                                  {event.changed_fields.join(', ')}
                                </span>
                              </div>
                            )}
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
