declare module 'docusign-esign' {
  class ApiClient {
    setOAuthBasePath(basePath: string): void;
    setBasePath(basePath: string): void;
    requestJWTUserToken(
      clientId: string,
      userId: string,
      scopes: string[],
      privateKey: Buffer,
      expiresIn: number
    ): Promise<any>;
    addDefaultHeader(key: string, value: string): void;
  }

  class EnvelopesApi {
    constructor(apiClient: ApiClient);
    createEnvelope(accountId: string, options: any): Promise<any>;
    getEnvelope(accountId: string, envelopeId: string): Promise<any>;
    createRecipientView(accountId: string, envelopeId: string, options: any): Promise<any>;
    update(accountId: string, envelopeId: string, options: any): Promise<any>;
    getDocument(accountId: string, envelopeId: string, documentId: string): Promise<any>;
  }

  class EnvelopeDefinition {
    templateId?: string;
    templateRoles?: any[];
    status?: string;
    emailSubject?: string;
    customFields?: any;
  }

  class TemplateRole {
    static constructFromObject(obj: any): any;
  }

  class TextCustomField {
    static constructFromObject(obj: any): any;
  }

  class RecipientViewRequest {
    static constructFromObject(obj: any): any;
  }

  class Envelope {
    static constructFromObject(obj: any): any;
  }

  namespace docusign {
    export {
      ApiClient,
      EnvelopesApi,
      EnvelopeDefinition,
      TemplateRole,
      TextCustomField,
      RecipientViewRequest,
      Envelope
    };
  }

  export default docusign;
}
