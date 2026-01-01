import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { PDFBrandingConfig } from '@/app/api/admin/payments/pdf-template/route';
import type { PaymentSchedule } from '@/types/payments';
import '@/lib/pdf/fonts';

interface EnrollmentData {
  id: string;
  product_name: string;
  product_type: string;
  enrolled_at: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  currency: string;
  payment_plan_name: string;
}

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface ReceiptData {
  enrollment: EnrollmentData;
  user: UserData;
  schedules: PaymentSchedule[];
  branding: PDFBrandingConfig;
  language: 'en' | 'he';
  translations: Record<string, string>;
  generatedDate: string;
}

// Helper function to get translation
const t = (translations: Record<string, string>, key: string, fallback: string): string => {
  return translations[key] || fallback;
};

// Helper function to format date
const formatDate = (dateStr: string, language: 'en' | 'he'): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Helper function to format currency
const formatCurrency = (amount: number, currency: string): string => {
  return `${currency} ${amount.toFixed(2)}`;
};

// Helper to get payment status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return '#10B981'; // green
    case 'pending':
      return '#F59E0B'; // amber
    case 'overdue':
      return '#EF4444'; // red
    case 'cancelled':
      return '#6B7280'; // gray
    default:
      return '#3B82F6'; // blue
  }
};

export const EnrollmentReceiptTemplate: React.FC<{ data: ReceiptData }> = ({ data }) => {
  const { enrollment, user, schedules, branding, language, translations, generatedDate } = data;
  const isRtl = language === 'he';
  const primaryColor = branding.branding.primary_color || '#3B82F6';
  const fontFamily = isRtl ? 'Heebo' : 'Roboto';

  // Create dynamic styles based on RTL and branding
  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontFamily,
      fontSize: 10,
      direction: isRtl ? 'rtl' : 'ltr',
    },
    // Header
    header: {
      marginBottom: 30,
      borderBottom: `2px solid ${primaryColor}`,
      paddingBottom: 20,
    },
    headerTop: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    logo: {
      width: 80,
      height: 40,
      objectFit: 'contain',
    },
    organizationName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: primaryColor,
    },
    documentTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1F2937',
      textAlign: isRtl ? 'right' : 'left',
      marginTop: 10,
    },
    documentInfo: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      fontSize: 9,
      color: '#6B7280',
    },
    // Organization Info Section
    orgInfoSection: {
      marginBottom: 20,
      padding: 10,
      backgroundColor: '#F9FAFB',
      borderRadius: 4,
    },
    orgInfoRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      marginBottom: 4,
      fontSize: 9,
    },
    orgInfoLabel: {
      fontWeight: 'bold',
      color: '#374151',
      minWidth: 80,
      textAlign: isRtl ? 'right' : 'left',
    },
    orgInfoValue: {
      color: '#6B7280',
      textAlign: isRtl ? 'right' : 'left',
    },
    // Section
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: primaryColor,
      marginBottom: 10,
      paddingBottom: 5,
      borderBottom: `1px solid ${primaryColor}`,
      textAlign: isRtl ? 'right' : 'left',
    },
    // Info rows
    infoRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      marginBottom: 8,
    },
    infoLabel: {
      width: '35%',
      fontWeight: 'bold',
      color: '#374151',
      textAlign: isRtl ? 'right' : 'left',
    },
    infoValue: {
      width: '65%',
      color: '#6B7280',
      textAlign: isRtl ? 'right' : 'left',
    },
    // Payment Summary Box
    summaryBox: {
      backgroundColor: `${primaryColor}15`,
      border: `2px solid ${primaryColor}`,
      borderRadius: 8,
      padding: 15,
      marginBottom: 20,
    },
    summaryRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#1F2937',
      textAlign: isRtl ? 'right' : 'left',
    },
    summaryValue: {
      fontSize: 11,
      color: '#1F2937',
      textAlign: isRtl ? 'right' : 'left',
    },
    summaryTotal: {
      borderTop: `1px solid ${primaryColor}`,
      paddingTop: 8,
      marginTop: 4,
    },
    summaryTotalLabel: {
      fontSize: 13,
      fontWeight: 'bold',
      color: primaryColor,
      textAlign: isRtl ? 'right' : 'left',
    },
    summaryTotalValue: {
      fontSize: 13,
      fontWeight: 'bold',
      color: primaryColor,
      textAlign: isRtl ? 'right' : 'left',
    },
    // Table
    table: {
      width: '100%',
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      backgroundColor: primaryColor,
      padding: 8,
      borderRadius: 4,
      marginBottom: 4,
    },
    tableHeaderCell: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: isRtl ? 'right' : 'left',
    },
    tableRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      borderBottom: '1px solid #E5E7EB',
      padding: 8,
      minHeight: 30,
      alignItems: 'center',
    },
    tableCell: {
      fontSize: 9,
      color: '#374151',
      textAlign: isRtl ? 'right' : 'left',
    },
    statusBadge: {
      padding: '3px 8px',
      borderRadius: 4,
      fontSize: 8,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      borderTop: `1px solid ${primaryColor}`,
      paddingTop: 10,
    },
    footerContact: {
      fontSize: 8,
      color: '#6B7280',
      marginBottom: 5,
      textAlign: isRtl ? 'right' : 'left',
    },
    footerCustomText: {
      fontSize: 8,
      color: '#6B7280',
      marginTop: 5,
      marginBottom: 5,
      textAlign: isRtl ? 'right' : 'left',
    },
    footerNotice: {
      fontSize: 7,
      color: '#9CA3AF',
      textAlign: 'center',
      marginTop: 5,
    },
    pageNumber: {
      fontSize: 8,
      color: '#6B7280',
      textAlign: 'center',
      marginTop: 5,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Logo or Organization Name */}
            {branding.branding.show_logo && branding.branding.logo_url ? (
              <Image src={branding.branding.logo_url} style={styles.logo} />
            ) : branding.branding.show_organization_name && branding.organization.name ? (
              <Text style={styles.organizationName}>{branding.organization.name}</Text>
            ) : null}
          </View>

          <Text style={styles.documentTitle}>
            {t(translations, 'pdf.receipt.title', 'Payment Receipt')}
          </Text>

          <View style={styles.documentInfo}>
            <Text>
              {t(translations, 'pdf.receipt.number', 'Receipt #')}: ENR-{enrollment.id.substring(0, 8).toUpperCase()}
            </Text>
            <Text>
              {t(translations, 'pdf.receipt.generated', 'Generated')}: {formatDate(generatedDate, language)}
            </Text>
          </View>
        </View>

        {/* Organization Info (if provided) */}
        {branding.organization.email || branding.organization.phone || branding.organization.address ? (
          <View style={styles.orgInfoSection}>
            {branding.organization.email && (
              <View style={styles.orgInfoRow}>
                <Text style={styles.orgInfoLabel}>{t(translations, 'pdf.org.email', 'Email')}:</Text>
                <Text style={styles.orgInfoValue}>{branding.organization.email}</Text>
              </View>
            )}
            {branding.organization.phone && (
              <View style={styles.orgInfoRow}>
                <Text style={styles.orgInfoLabel}>{t(translations, 'pdf.org.phone', 'Phone')}:</Text>
                <Text style={styles.orgInfoValue}>{branding.organization.phone}</Text>
              </View>
            )}
            {branding.organization.address && (
              <View style={styles.orgInfoRow}>
                <Text style={styles.orgInfoLabel}>{t(translations, 'pdf.org.address', 'Address')}:</Text>
                <Text style={styles.orgInfoValue}>{branding.organization.address}</Text>
              </View>
            )}
            {branding.organization.website && (
              <View style={styles.orgInfoRow}>
                <Text style={styles.orgInfoLabel}>{t(translations, 'pdf.org.website', 'Website')}:</Text>
                <Text style={styles.orgInfoValue}>{branding.organization.website}</Text>
              </View>
            )}
            {branding.organization.tax_id && (
              <View style={styles.orgInfoRow}>
                <Text style={styles.orgInfoLabel}>{t(translations, 'pdf.org.tax_id', 'Tax ID')}:</Text>
                <Text style={styles.orgInfoValue}>{branding.organization.tax_id}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Student Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(translations, 'pdf.student.title', 'Student Information')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t(translations, 'pdf.student.name', 'Name')}:</Text>
            <Text style={[styles.infoValue, { direction: isRtl ? 'rtl' : 'ltr' }]}>
              {isRtl ? `${user.last_name} ${user.first_name}` : `${user.first_name} ${user.last_name}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t(translations, 'pdf.student.email', 'Email')}:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          {user.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t(translations, 'pdf.student.phone', 'Phone')}:</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
          )}
          {user.address && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t(translations, 'pdf.student.address', 'Address')}:</Text>
              <Text style={styles.infoValue}>{user.address}</Text>
            </View>
          )}
        </View>

        {/* Enrollment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(translations, 'pdf.enrollment.title', 'Enrollment Summary')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t(translations, 'pdf.enrollment.product', 'Product')}:</Text>
            <Text style={styles.infoValue}>{enrollment.product_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t(translations, 'pdf.enrollment.type', 'Type')}:</Text>
            <Text style={styles.infoValue}>
              {t(translations, `pdf.enrollment.productType.${enrollment.product_type}`, enrollment.product_type)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t(translations, 'pdf.enrollment.date', 'Enrollment Date')}:</Text>
            <Text style={styles.infoValue}>{formatDate(enrollment.enrolled_at, language)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t(translations, 'pdf.enrollment.paymentPlan', 'Payment Plan')}:</Text>
            <Text style={styles.infoValue}>{enrollment.payment_plan_name}</Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t(translations, 'pdf.summary.total', 'Total Amount')}:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(enrollment.total_amount, enrollment.currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t(translations, 'pdf.summary.paid', 'Amount Paid')}:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(enrollment.paid_amount, enrollment.currency)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>{t(translations, 'pdf.summary.outstanding', 'Outstanding Balance')}:</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(enrollment.remaining_amount, enrollment.currency)}</Text>
          </View>
        </View>

        {/* Payment Schedule Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(translations, 'pdf.schedule.title', 'Payment Schedule')}</Text>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '8%' }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { width: '18%' }]}>
                {t(translations, 'pdf.schedule.type', 'Type')}
              </Text>
              <Text style={[styles.tableHeaderCell, { width: '18%' }]}>
                {t(translations, 'pdf.schedule.scheduledDate', 'Scheduled')}
              </Text>
              <Text style={[styles.tableHeaderCell, { width: '18%' }]}>
                {t(translations, 'pdf.schedule.paidDate', 'Paid Date')}
              </Text>
              <Text style={[styles.tableHeaderCell, { width: '18%' }]}>
                {t(translations, 'pdf.schedule.amount', 'Amount')}
              </Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>
                {t(translations, 'pdf.schedule.status', 'Status')}
              </Text>
            </View>

            {/* Table Rows */}
            {schedules.map((schedule, index) => (
              <View key={`schedule-${index}`} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '8%' }]}>{schedule.payment_number}</Text>
                <Text style={[styles.tableCell, { width: '18%' }]}>
                  {t(translations, `pdf.schedule.paymentType.${schedule.payment_type}`, schedule.payment_type)}
                </Text>
                <Text style={[styles.tableCell, { width: '18%' }]}>
                  {formatDate(schedule.scheduled_date, language)}
                </Text>
                <Text style={[styles.tableCell, { width: '18%' }]}>
                  {schedule.paid_date ? formatDate(schedule.paid_date, language) : '-'}
                </Text>
                <Text style={[styles.tableCell, { width: '18%' }]}>
                  {formatCurrency(schedule.amount, schedule.currency)}
                </Text>
                <View style={{ width: '20%' }}>
                  <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
                    {t(translations, `pdf.schedule.statusValue.${schedule.status}`, schedule.status)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Contact Info */}
          {branding.footer.show_contact_info && (
            <View>
              {branding.organization.email && (
                <Text style={styles.footerContact}>
                  {t(translations, 'pdf.footer.email', 'Email')}: {branding.organization.email}
                </Text>
              )}
              {branding.organization.phone && (
                <Text style={styles.footerContact}>
                  {t(translations, 'pdf.footer.phone', 'Phone')}: {branding.organization.phone}
                </Text>
              )}
            </View>
          )}

          {/* Custom Footer Text */}
          {branding.footer.custom_footer_text && (
            <Text style={styles.footerCustomText}>{branding.footer.custom_footer_text}</Text>
          )}

          {/* Official Notice */}
          <Text style={styles.footerNotice}>
            {t(translations, 'pdf.footer.notice', 'This is an official payment receipt')}
          </Text>

          {/* Page Numbers */}
          {branding.footer.show_page_numbers && (
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) =>
              `${t(translations, 'pdf.footer.page', 'Page')} ${pageNumber} ${t(translations, 'pdf.footer.of', 'of')} ${totalPages}`
            } fixed />
          )}
        </View>
      </Page>
    </Document>
  );
};
