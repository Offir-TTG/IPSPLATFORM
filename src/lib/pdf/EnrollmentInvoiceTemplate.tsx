import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { PDFBrandingConfig } from '@/app/api/admin/payments/pdf-template/route';

interface InvoiceData {
  enrollment: {
    id: string;
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
  branding: PDFBrandingConfig;
  language: 'en' | 'he';
  translations: Record<string, string>;
  generatedDate: string;
}

export const EnrollmentInvoiceTemplate: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const { enrollment, user, branding, language, translations, generatedDate } = data;
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
    row: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      marginBottom: 5,
      justifyContent: 'space-between',
    },
    label: {
      flex: 2,
      fontWeight: 'bold',
      textAlign: isRTL ? 'right' : 'left',
    },
    value: {
      flex: 3,
      textAlign: isRTL ? 'right' : 'left',
    },
    summaryBox: {
      backgroundColor: '#f3f4f6',
      border: `2 solid ${branding.branding.primary_color}`,
      borderRadius: 8,
      padding: 15,
      marginTop: 20,
      marginBottom: 20,
    },
    summaryRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: isRTL ? 'right' : 'left',
    },
    summaryValue: {
      fontSize: 11,
      textAlign: isRTL ? 'left' : 'right',
    },
    totalRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 10,
      borderTop: `1 solid ${branding.branding.primary_color}`,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: branding.branding.primary_color,
      textAlign: isRTL ? 'right' : 'left',
    },
    totalValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: branding.branding.primary_color,
      textAlign: isRTL ? 'left' : 'right',
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
    orgInfo: {
      backgroundColor: '#f9fafb',
      padding: 10,
      borderRadius: 4,
      marginBottom: 20,
    },
    orgInfoText: {
      fontSize: 9,
      marginBottom: 3,
      textAlign: isRTL ? 'right' : 'left',
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${enrollment.currency}`;
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
                  {t('pdf.invoice.title', 'Enrollment Invoice')}
                </Text>
                <Text style={{ fontSize: 10, marginTop: 5, textAlign: 'right' }}>
                  {enrollment.invoice_number} :{t('pdf.invoice.number', 'Invoice #')}
                </Text>
                <Text style={{ fontSize: 9, marginTop: 3, color: '#6b7280', textAlign: 'right' }}>
                  {formatDate(generatedDate)} :{t('pdf.invoice.date', 'Date')}
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
                  {t('pdf.invoice.title', 'Enrollment Invoice')}
                </Text>
                <Text style={{ fontSize: 10, marginTop: 5, textAlign: 'left' }}>
                  {t('pdf.invoice.number', 'Invoice #')}: {enrollment.invoice_number}
                </Text>
                <Text style={{ fontSize: 9, marginTop: 3, color: '#6b7280', textAlign: 'left' }}>
                  {t('pdf.invoice.date', 'Date')}: {formatDate(generatedDate)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Organization and Customer Info Row */}
        <View style={{ flexDirection: 'row', gap: 30, marginBottom: 20 }}>
          {isRTL ? (
            <>
              {/* Student Information - Right side for RTL */}
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {t('pdf.invoice.billTo', 'Bill To')}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5, textAlign: 'right', direction: 'rtl' }}>
                  {user.last_name} {user.first_name}
                </Text>
                <Text style={{ fontSize: 9, marginBottom: 3, textAlign: 'right' }}>{user.email}</Text>
                {user.phone && <Text style={{ fontSize: 9, marginBottom: 3, textAlign: 'right' }}>{user.phone}</Text>}
                {user.address && (
                  <>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', textAlign: 'right', marginTop: 3 }}>
                      :{t('pdf.invoice.address', 'Address')}
                    </Text>
                    <Text style={{ fontSize: 9, textAlign: 'right' }}>
                      {user.address}
                    </Text>
                  </>
                )}
              </View>

              {/* Organization Info - Left side for RTL */}
              {branding.footer.show_contact_info && (
                <View style={[styles.orgInfo, { flex: 1, marginBottom: 0 }]}>
                  {branding.organization.name && (
                    <Text style={styles.orgInfoText}>{branding.organization.name}</Text>
                  )}
                  {branding.organization.email && (
                    <Text style={styles.orgInfoText}>
                      {branding.organization.email} :{t('pdf.invoice.email', 'Email')}
                    </Text>
                  )}
                  {branding.organization.phone && (
                    <Text style={styles.orgInfoText}>
                      {branding.organization.phone} :{t('pdf.invoice.phone', 'Phone')}
                    </Text>
                  )}
                  {branding.organization.address && (
                    <>
                      <Text style={[styles.orgInfoText, { fontWeight: 'bold' }]}>
                        :{t('pdf.invoice.address', 'Address')}
                      </Text>
                      <Text style={styles.orgInfoText}>
                        {branding.organization.address}
                      </Text>
                    </>
                  )}
                  {branding.organization.website && (
                    <Text style={styles.orgInfoText}>
                      {branding.organization.website} :{t('pdf.invoice.website', 'Website')}
                    </Text>
                  )}
                  {branding.organization.tax_id && (
                    <Text style={styles.orgInfoText}>
                      {branding.organization.tax_id} :{t('pdf.invoice.taxId', 'Tax ID')}
                    </Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              {/* Organization Info - Left side for LTR */}
              {branding.footer.show_contact_info && (
                <View style={[styles.orgInfo, { flex: 1, marginBottom: 0 }]}>
                  {branding.organization.name && (
                    <Text style={styles.orgInfoText}>{branding.organization.name}</Text>
                  )}
                  {branding.organization.email && (
                    <Text style={styles.orgInfoText}>
                      {t('pdf.invoice.email', 'Email')}: {branding.organization.email}
                    </Text>
                  )}
                  {branding.organization.phone && (
                    <Text style={styles.orgInfoText}>
                      {t('pdf.invoice.phone', 'Phone')}: {branding.organization.phone}
                    </Text>
                  )}
                  {branding.organization.address && (
                    <Text style={styles.orgInfoText}>
                      {t('pdf.invoice.address', 'Address')}: {branding.organization.address}
                    </Text>
                  )}
                  {branding.organization.website && (
                    <Text style={styles.orgInfoText}>
                      {t('pdf.invoice.website', 'Website')}: {branding.organization.website}
                    </Text>
                  )}
                  {branding.organization.tax_id && (
                    <Text style={styles.orgInfoText}>
                      {t('pdf.invoice.taxId', 'Tax ID')}: {branding.organization.tax_id}
                    </Text>
                  )}
                </View>
              )}

              {/* Student Information - Right side for LTR */}
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  {t('pdf.invoice.billTo', 'Bill To')}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5, textAlign: 'left' }}>
                  {user.first_name} {user.last_name}
                </Text>
                <Text style={{ fontSize: 9, marginBottom: 3, textAlign: 'left' }}>{user.email}</Text>
                {user.phone && <Text style={{ fontSize: 9, marginBottom: 3, textAlign: 'left' }}>{user.phone}</Text>}
                {user.address && (
                  <>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', textAlign: 'left', marginTop: 3 }}>
                      {t('pdf.invoice.address', 'Address')}:
                    </Text>
                    <Text style={{ fontSize: 9, textAlign: 'left' }}>
                      {user.address}
                    </Text>
                  </>
                )}
              </View>
            </>
          )}
        </View>

        {/* Enrollment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('pdf.invoice.enrollmentDetails', 'Enrollment Details')}
          </Text>
          <View style={styles.row}>
            {isRTL ? (
              <>
                <Text style={styles.label}>:{t('pdf.invoice.product', 'Product')}</Text>
                <Text style={styles.value}>{enrollment.product_name}</Text>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('pdf.invoice.product', 'Product')}:</Text>
                <Text style={styles.value}>{enrollment.product_name}</Text>
              </>
            )}
          </View>
          <View style={styles.row}>
            {isRTL ? (
              <>
                <Text style={styles.label}>:{t('pdf.invoice.type', 'Type')}</Text>
                <Text style={styles.value}>
                  {t(`pdf.invoice.productType.${enrollment.product_type}`, enrollment.product_type)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('pdf.invoice.type', 'Type')}:</Text>
                <Text style={styles.value}>
                  {t(`pdf.invoice.productType.${enrollment.product_type}`, enrollment.product_type)}
                </Text>
              </>
            )}
          </View>
          <View style={styles.row}>
            {isRTL ? (
              <>
                <Text style={styles.label}>:{t('pdf.invoice.enrolledDate', 'Enrollment Date')}</Text>
                <Text style={styles.value}>{formatDate(enrollment.enrolled_at)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('pdf.invoice.enrolledDate', 'Enrollment Date')}:</Text>
                <Text style={styles.value}>{formatDate(enrollment.enrolled_at)}</Text>
              </>
            )}
          </View>
          <View style={styles.row}>
            {isRTL ? (
              <>
                <Text style={styles.label}>:{t('pdf.invoice.paymentPlan', 'Payment Plan')}</Text>
                <Text style={styles.value}>{enrollment.payment_plan_name}</Text>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('pdf.invoice.paymentPlan', 'Payment Plan')}:</Text>
                <Text style={styles.value}>{enrollment.payment_plan_name}</Text>
              </>
            )}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryBox}>
          <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>
            {t('pdf.invoice.paymentSummary', 'Payment Summary')}
          </Text>
          <View style={styles.summaryRow}>
            {isRTL ? (
              <>
                <Text style={styles.summaryLabel}>
                  :{t('pdf.invoice.totalAmount', 'Total Amount')}
                </Text>
                <Text style={styles.summaryValue}>{formatCurrency(enrollment.total_amount)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.summaryLabel}>
                  {t('pdf.invoice.totalAmount', 'Total Amount')}:
                </Text>
                <Text style={styles.summaryValue}>{formatCurrency(enrollment.total_amount)}</Text>
              </>
            )}
          </View>
          <View style={styles.summaryRow}>
            {isRTL ? (
              <>
                <Text style={styles.summaryLabel}>
                  :{t('pdf.invoice.paidAmount', 'Paid Amount')}
                </Text>
                <Text style={styles.summaryValue}>{formatCurrency(enrollment.paid_amount)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.summaryLabel}>
                  {t('pdf.invoice.paidAmount', 'Paid Amount')}:
                </Text>
                <Text style={styles.summaryValue}>{formatCurrency(enrollment.paid_amount)}</Text>
              </>
            )}
          </View>
          <View style={styles.totalRow}>
            {isRTL ? (
              <>
                <Text style={styles.totalLabel}>
                  :{t('pdf.invoice.remainingBalance', 'Remaining Balance')}
                </Text>
                <Text style={styles.totalValue}>{formatCurrency(enrollment.remaining_amount)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.totalLabel}>
                  {t('pdf.invoice.remainingBalance', 'Remaining Balance')}:
                </Text>
                <Text style={styles.totalValue}>{formatCurrency(enrollment.remaining_amount)}</Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {branding.footer.custom_footer_text && (
            <Text style={styles.footerText}>{branding.footer.custom_footer_text}</Text>
          )}
          <Text style={styles.footerText}>
            {t('pdf.invoice.officialDocument', 'This is an official enrollment invoice')}
          </Text>
          {branding.footer.show_contact_info && branding.organization.email && (
            <Text style={styles.footerText}>
              {isRTL ? (
                <>{branding.organization.email} {t('pdf.invoice.questions', 'Questions? Contact us at')}</>
              ) : (
                <>{t('pdf.invoice.questions', 'Questions? Contact us at')} {branding.organization.email}</>
              )}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
};
