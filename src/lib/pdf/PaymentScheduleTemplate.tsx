import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { PDFBrandingConfig } from '@/app/api/admin/payments/pdf-template/route';
import type { PaymentSchedule } from '@/types/payments';

interface ScheduleData {
  enrollment: {
    id: string;
    invoice_number: string;
    product_name: string;
    product_type: string;
    enrolled_at: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    currency: string;
    payment_plan_name: string;
  };
  user: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  schedules: PaymentSchedule[];
  branding: PDFBrandingConfig;
  language: 'en' | 'he';
  translations: Record<string, string>;
  generatedDate: string;
}

export const PaymentScheduleTemplate: React.FC<{ data: ScheduleData }> = ({ data }) => {
  const { enrollment, user, schedules, branding, language, translations, generatedDate } = data;
  const isRTL = language === 'he';
  const fontFamily = isRTL ? 'Heebo' : 'Roboto';

  const t = (key: string, fallback: string) => translations[key] || fallback;

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontFamily,
      fontSize: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 30,
      paddingBottom: 20,
      borderBottom: `2 solid ${branding.branding.primary_color}`,
    },
    logo: {
      width: 80,
      height: 80,
      objectFit: 'contain',
    },
    headerText: {
      flexDirection: 'column',
      alignItems: isRTL ? 'flex-end' : 'flex-start',
      textAlign: isRTL ? 'right' : 'left',
    },
    orgName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: branding.branding.primary_color,
      marginBottom: 5,
      textAlign: isRTL ? 'right' : 'left',
    },
    documentTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 10,
      textAlign: isRTL ? 'right' : 'left',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 10,
      color: branding.branding.primary_color,
      textAlign: isRTL ? 'right' : 'left',
    },
    table: {
      width: '100%',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 4,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: branding.branding.primary_color,
      padding: 8,
    },
    tableHeaderCell: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 9,
      textAlign: isRTL ? 'right' : 'left',
    },
    tableRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
      padding: 8,
    },
    tableCell: {
      fontSize: 9,
      textAlign: isRTL ? 'right' : 'left',
    },
    col1: { width: '7%' },
    col2: { width: '15%' },
    col3: { width: '15%' },
    col4: { width: '13%' },
    col5: { width: '15%' },
    col6: { width: '15%' },
    col7: { width: '20%' },
    refundedText: {
      fontSize: 8,
      color: '#9333ea',
      textAlign: isRTL ? 'right' : 'left',
    },
    statusBadge: {
      padding: '3 6',
      borderRadius: 3,
      fontSize: 8,
      textAlign: 'center',
    },
    statusPaid: {
      backgroundColor: '#dcfce7',
      color: '#166534',
    },
    statusPending: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
    },
    statusOverdue: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
    },
    statusPartiallyRefunded: {
      backgroundColor: '#f3e8ff',
      color: '#6b21a8',
    },
    statusRefunded: {
      backgroundColor: '#f3e8ff',
      color: '#6b21a8',
    },
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      borderTop: `1 solid #e5e7eb`,
      paddingTop: 10,
    },
    footerText: {
      fontSize: 8,
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: 3,
    },
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${enrollment.currency}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return [styles.statusBadge, styles.statusPaid];
      case 'pending':
        return [styles.statusBadge, styles.statusPending];
      case 'overdue':
        return [styles.statusBadge, styles.statusOverdue];
      case 'partially_refunded':
        return [styles.statusBadge, styles.statusPartiallyRefunded];
      case 'refunded':
        return [styles.statusBadge, styles.statusRefunded];
      default:
        return [styles.statusBadge];
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {isRTL ? (
            <>
              {branding.branding.show_logo && branding.branding.logo_url ? (
                <Image src={branding.branding.logo_url} style={styles.logo} />
              ) : branding.branding.show_organization_name ? (
                <View style={[styles.headerText, { alignItems: 'flex-start' }]}>
                  <Text style={[styles.orgName, { textAlign: 'left' }]}>{branding.organization.name}</Text>
                </View>
              ) : null}
              <View style={styles.headerText}>
                <Text style={styles.documentTitle}>
                  {t('pdf.schedule.title', 'Payment Schedule')}
                </Text>
                <Text style={{ fontSize: 10, marginTop: 5, textAlign: 'right' }}>
                  {enrollment.invoice_number} :{t('pdf.invoice.number', 'Invoice #')}
                </Text>
                <Text style={{ fontSize: 9, marginTop: 3, color: '#6b7280', textAlign: 'right' }}>
                  {formatDate(generatedDate)} :{t('pdf.schedule.date', 'Date')}
                </Text>
              </View>
            </>
          ) : (
            <>
              {branding.branding.show_logo && branding.branding.logo_url ? (
                <Image src={branding.branding.logo_url} style={styles.logo} />
              ) : branding.branding.show_organization_name ? (
                <View style={styles.headerText}>
                  <Text style={styles.orgName}>{branding.organization.name}</Text>
                </View>
              ) : null}
              <View style={styles.headerText}>
                <Text style={styles.documentTitle}>
                  {t('pdf.schedule.title', 'Payment Schedule')}
                </Text>
                <Text style={{ fontSize: 10, marginTop: 5, textAlign: 'left' }}>
                  {t('pdf.invoice.number', 'Invoice #')}: {enrollment.invoice_number}
                </Text>
                <Text style={{ fontSize: 9, marginTop: 3, color: '#6b7280', textAlign: 'left' }}>
                  {t('pdf.schedule.date', 'Date')}: {formatDate(generatedDate)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Student Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('pdf.schedule.student', 'Student Information')}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5, textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}>
            {isRTL ? `${user.last_name} ${user.first_name}` : `${user.first_name} ${user.last_name}`}
          </Text>
          <Text style={{ fontSize: 10, marginBottom: 3, textAlign: isRTL ? 'right' : 'left' }}>
            {isRTL ? (
              <>{user.email} :<Text style={{ fontWeight: 'bold' }}>{t('pdf.schedule.email', 'Email')}</Text></>
            ) : (
              <><Text style={{ fontWeight: 'bold' }}>{t('pdf.schedule.email', 'Email')}: </Text>{user.email}</>
            )}
          </Text>
        </View>

        {/* Payment Schedule Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('pdf.schedule.paymentsTitle', 'Payment Schedule')}
          </Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              {isRTL ? (
                <>
                  <Text style={[styles.tableHeaderCell, styles.col7]}>
                    {t('pdf.schedule.status', 'Status')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col6]}>
                    {t('pdf.schedule.refunded', 'Refunded')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col5]}>
                    {t('pdf.schedule.amount', 'Amount')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col4]}>
                    {t('pdf.schedule.paidDate', 'Paid Date')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col3]}>
                    {t('pdf.schedule.scheduledDate', 'Scheduled')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col2]}>
                    {t('pdf.schedule.type', 'Type')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col1]}>
                    {t('pdf.schedule.number', '#')}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.tableHeaderCell, styles.col1]}>
                    {t('pdf.schedule.number', '#')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col2]}>
                    {t('pdf.schedule.type', 'Type')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col3]}>
                    {t('pdf.schedule.scheduledDate', 'Scheduled')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col4]}>
                    {t('pdf.schedule.paidDate', 'Paid Date')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col5]}>
                    {t('pdf.schedule.amount', 'Amount')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col6]}>
                    {t('pdf.schedule.refunded', 'Refunded')}
                  </Text>
                  <Text style={[styles.tableHeaderCell, styles.col7]}>
                    {t('pdf.schedule.status', 'Status')}
                  </Text>
                </>
              )}
            </View>

            {/* Table Rows */}
            {schedules.map((schedule, index) => {
              const hasRefund = schedule.refunded_amount && schedule.refunded_amount > 0;
              const displayStatus = hasRefund && schedule.payment_status === 'partially_refunded'
                ? 'partially_refunded'
                : schedule.status;

              return (
                <View key={`schedule-${index}`} style={styles.tableRow}>
                  {isRTL ? (
                    <>
                      <View style={[styles.col7, { paddingLeft: 5 }]}>
                        <Text style={getStatusStyle(displayStatus)}>
                          {t(`pdf.schedule.statusLabel.${displayStatus}`, displayStatus.toUpperCase())}
                        </Text>
                      </View>
                      <Text style={[hasRefund ? styles.refundedText : styles.tableCell, styles.col6]}>
                        {hasRefund ? `(${formatCurrency(schedule.refunded_amount ?? 0)})` : '-'}
                      </Text>
                      <Text style={[styles.tableCell, styles.col5]}>
                        {formatCurrency(schedule.amount)}
                      </Text>
                      <Text style={[styles.tableCell, styles.col4]}>
                        {formatDate(schedule.paid_date)}
                      </Text>
                      <Text style={[styles.tableCell, styles.col3]}>
                        {formatDate(schedule.scheduled_date)}
                      </Text>
                      <Text style={[styles.tableCell, styles.col2]}>
                        {t(`pdf.schedule.paymentType.${schedule.payment_type}`, schedule.payment_type)}
                      </Text>
                      <Text style={[styles.tableCell, styles.col1]}>
                        {schedule.payment_number}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.tableCell, styles.col1]}>
                        {schedule.payment_number}
                      </Text>
                      <Text style={[styles.tableCell, styles.col2]}>
                        {t(`pdf.schedule.paymentType.${schedule.payment_type}`, schedule.payment_type)}
                      </Text>
                      <Text style={[styles.tableCell, styles.col3]}>
                        {formatDate(schedule.scheduled_date)}
                      </Text>
                      <Text style={[styles.tableCell, styles.col4]}>
                        {formatDate(schedule.paid_date)}
                      </Text>
                      <Text style={[styles.tableCell, styles.col5]}>
                        {formatCurrency(schedule.amount)}
                      </Text>
                      <Text style={[hasRefund ? styles.refundedText : styles.tableCell, styles.col6]}>
                        {hasRefund ? `(${formatCurrency(schedule.refunded_amount ?? 0)})` : '-'}
                      </Text>
                      <View style={[styles.col7, { paddingRight: 5 }]}>
                        <Text style={getStatusStyle(displayStatus)}>
                          {t(`pdf.schedule.statusLabel.${displayStatus}`, displayStatus.toUpperCase())}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {branding.footer.custom_footer_text && (
            <Text style={styles.footerText}>{branding.footer.custom_footer_text}</Text>
          )}
          <Text style={styles.footerText}>
            {t('pdf.schedule.officialDocument', 'This is an official payment schedule')}
          </Text>
          {branding.footer.show_contact_info && branding.organization.email && (
            <Text style={styles.footerText}>
              {isRTL ? (
                <>{branding.organization.email} {t('pdf.schedule.questions', 'Questions? Contact us at')}</>
              ) : (
                <>{t('pdf.schedule.questions', 'Questions? Contact us at')} {branding.organization.email}</>
              )}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};
