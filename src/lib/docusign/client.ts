import docusign from 'docusign-esign';

interface RecipientInfo {
  email: string;
  name: string;
  recipientId: string;
  routingOrder?: string;
}

interface EnvelopeResponse {
  envelopeId: string;
  status: string;
  statusDateTime: string;
}

export class DocuSignClient {
  private apiClient: docusign.ApiClient;
  private accountId: string;

  constructor() {
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || '';
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY || '';
    const userId = process.env.DOCUSIGN_USER_ID || '';
    const privateKey = process.env.DOCUSIGN_PRIVATE_KEY || '';
    const oAuthBasePath = process.env.DOCUSIGN_OAUTH_BASE_PATH || '';
    const basePath = process.env.DOCUSIGN_BASE_PATH || '';

    if (!this.accountId || !integrationKey || !userId || !privateKey) {
      throw new Error('DocuSign credentials are not configured');
    }

    // Initialize API client
    this.apiClient = new docusign.ApiClient();
    this.apiClient.setOAuthBasePath(oAuthBasePath.replace('https://', ''));
    this.apiClient.setBasePath(basePath);
  }

  /**
   * Authenticate using JWT
   */
  private async authenticate(): Promise<void> {
    try {
      const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY || '';
      const userId = process.env.DOCUSIGN_USER_ID || '';
      const privateKey = process.env.DOCUSIGN_PRIVATE_KEY || '';
      const scopes = ['signature', 'impersonation'];

      // Request JWT token
      const results = await this.apiClient.requestJWTUserToken(
        integrationKey,
        userId,
        scopes,
        Buffer.from(privateKey),
        3600 // 1 hour
      );

      this.apiClient.addDefaultHeader(
        'Authorization',
        `Bearer ${results.body.access_token}`
      );
    } catch (error) {
      console.error('DocuSign authentication failed:', error);
      throw new Error('Failed to authenticate with DocuSign');
    }
  }

  /**
   * Send an envelope using a template
   */
  async sendEnvelopeFromTemplate(
    templateId: string,
    recipient: RecipientInfo,
    emailSubject: string,
    customFields?: Record<string, string>
  ): Promise<EnvelopeResponse> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      // Create template role for recipient
      const templateRole = docusign.TemplateRole.constructFromObject({
        email: recipient.email,
        name: recipient.name,
        roleName: 'Student', // This should match the role in your template
        clientUserId: recipient.recipientId,
      });

      // Create envelope definition
      const envelopeDefinition = new docusign.EnvelopeDefinition();
      envelopeDefinition.templateId = templateId;
      envelopeDefinition.templateRoles = [templateRole];
      envelopeDefinition.status = 'sent';
      envelopeDefinition.emailSubject = emailSubject;

      // Add custom fields if provided
      if (customFields) {
        const textCustomFields = Object.entries(customFields).map(
          ([name, value]) =>
            docusign.TextCustomField.constructFromObject({ name, value })
        );
        envelopeDefinition.customFields = {
          textCustomFields,
        };
      }

      // Send the envelope
      const results = await envelopesApi.createEnvelope(
        this.accountId,
        { envelopeDefinition }
      );

      return {
        envelopeId: results.envelopeId || '',
        status: results.status || '',
        statusDateTime: results.statusDateTime || '',
      };
    } catch (error) {
      console.error('Failed to send DocuSign envelope:', error);
      throw new Error('Failed to send DocuSign envelope');
    }
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(envelopeId: string): Promise<any> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const envelope = await envelopesApi.getEnvelope(
        this.accountId,
        envelopeId
      );

      return envelope;
    } catch (error) {
      console.error('Failed to get envelope status:', error);
      throw new Error('Failed to get envelope status');
    }
  }

  /**
   * Get recipient view URL (for embedded signing)
   */
  async getRecipientViewUrl(
    envelopeId: string,
    recipient: RecipientInfo,
    returnUrl: string
  ): Promise<string> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      const viewRequest = docusign.RecipientViewRequest.constructFromObject({
        returnUrl,
        authenticationMethod: 'email',
        email: recipient.email,
        userName: recipient.name,
        clientUserId: recipient.recipientId,
      });

      const results = await envelopesApi.createRecipientView(
        this.accountId,
        envelopeId,
        { recipientViewRequest: viewRequest }
      );

      return results.url || '';
    } catch (error) {
      console.error('Failed to get recipient view URL:', error);
      throw new Error('Failed to get recipient view URL');
    }
  }

  /**
   * Void an envelope
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);

      const voidEnvelopeRequest = docusign.Envelope.constructFromObject({
        status: 'voided',
        voidedReason: reason,
      });

      await envelopesApi.update(this.accountId, envelopeId, {
        envelope: voidEnvelopeRequest,
      });
    } catch (error) {
      console.error('Failed to void envelope:', error);
      throw new Error('Failed to void envelope');
    }
  }

  /**
   * Download envelope documents
   */
  async downloadDocuments(envelopeId: string): Promise<Buffer> {
    await this.authenticate();

    try {
      const envelopesApi = new docusign.EnvelopesApi(this.apiClient);
      const documents = await envelopesApi.getDocument(
        this.accountId,
        envelopeId,
        'combined'
      );

      return documents as Buffer;
    } catch (error) {
      console.error('Failed to download documents:', error);
      throw new Error('Failed to download documents');
    }
  }
}

// Singleton instance
let docusignClient: DocuSignClient | null = null;

export function getDocuSignClient(): DocuSignClient {
  if (!docusignClient) {
    docusignClient = new DocuSignClient();
  }
  return docusignClient;
}
