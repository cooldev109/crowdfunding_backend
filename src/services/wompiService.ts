import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { ENV } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../middlewares/errorHandler';

// Wompi API Configuration
const WOMPI_BASE_URL = ENV.NODE_ENV === 'production'
  ? 'https://production.wompi.co/v1'
  : 'https://sandbox.wompi.co/v1';

// Wompi Transaction Status
export enum WompiTransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  VOIDED = 'VOIDED',
  ERROR = 'ERROR',
}

// Wompi Payment Methods
export enum WompiPaymentMethod {
  CARD = 'CARD',
  PSE = 'PSE',
  BANCOLOMBIA_TRANSFER = 'BANCOLOMBIA_TRANSFER',
  BANCOLOMBIA_QR = 'BANCOLOMBIA_QR',
  NEQUI = 'NEQUI',
}

// Interfaces
export interface WompiCardTokenRequest {
  number: string;
  cvc: string;
  exp_month: string;
  exp_year: string;
  card_holder: string;
}

export interface WompiTransactionRequest {
  amount_in_cents: number;
  currency: string;
  customer_email: string;
  reference: string;
  payment_method: {
    type: WompiPaymentMethod;
    token?: string;
    installments?: number;
    user_type?: number | string; // PSE: 0 = persona, 1 = empresa; Bancolombia: "PERSON"
    user_legal_id_type?: string;
    user_legal_id?: string;
    financial_institution_code?: string;
    payment_description?: string;
  };
  redirect_url?: string;
  customer_data?: {
    phone_number?: string;
    full_name?: string;
    legal_id?: string;
    legal_id_type?: string;
  };
}

export interface WompiTransaction {
  id: string;
  status: WompiTransactionStatus;
  status_message: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type: WompiPaymentMethod;
  payment_link_id?: string;
  redirect_url?: string;
  created_at: string;
  finalized_at?: string;
}

export interface WompiBank {
  financial_institution_code: string;
  financial_institution_name: string;
}

// Disbursement (Payout) interfaces
export interface WompiDisbursementRequest {
  amount_in_cents: number;
  currency: string;
  reference: string;
  bank_account: {
    bank_code: string;
    account_type: 'SAVINGS' | 'CHECKING'; // SAVINGS = Ahorros, CHECKING = Corriente
    account_number: string;
    account_holder_name: string;
    account_holder_document_type: string; // CC, CE, NIT, TI, PP
    account_holder_document_number: string;
  };
  description?: string;
}

export interface WompiDisbursement {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  status_message?: string;
  reference: string;
  amount_in_cents: number;
  currency: string;
  bank_account: {
    bank_code: string;
    account_type: string;
    account_number_last_four: string;
  };
  created_at: string;
  finalized_at?: string;
}

export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: WompiTransaction;
  };
  signature: {
    checksum: string;
    properties: string[];
  };
  timestamp: number;
  sent_at: string;
}

class WompiService {
  private client: AxiosInstance;
  private publicKey: string;
  private privateKey: string;
  private eventsSecret: string;
  private integritySecret: string;

  constructor() {
    this.publicKey = ENV.WOMPI_PUBLIC_KEY || '';
    this.privateKey = ENV.WOMPI_PRIVATE_KEY || '';
    this.eventsSecret = ENV.WOMPI_EVENTS_SECRET || '';
    this.integritySecret = ENV.WOMPI_INTEGRITY_SECRET || '';

    this.client = axios.create({
      baseURL: WOMPI_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.privateKey}`,
      },
    });

    // Log configuration status
    if (!this.privateKey) {
      logger.warn('Wompi private key not configured');
    }
  }

  /**
   * Get acceptance token (required for transactions)
   */
  async getAcceptanceToken(): Promise<string> {
    try {
      const response = await this.client.get(`/merchants/${this.publicKey}`);
      return response.data.data.presigned_acceptance.acceptance_token;
    } catch (error: any) {
      logger.error('Error getting acceptance token:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || 'Failed to get acceptance token', 400);
    }
  }

  /**
   * Tokenize a credit/debit card
   */
  async tokenizeCard(cardData: WompiCardTokenRequest): Promise<string> {
    try {
      const response = await axios.post(
        `${WOMPI_BASE_URL}/tokens/cards`,
        cardData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.publicKey}`,
          },
        }
      );
      return response.data.data.id;
    } catch (error: any) {
      logger.error('Error tokenizing card:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || 'Failed to tokenize card', 400);
    }
  }

  /**
   * Create a card transaction
   */
  async createCardTransaction(params: {
    cardToken: string;
    amount: number;
    reference: string;
    customerEmail: string;
    customerName: string;
    customerDocument: string;
    customerDocumentType?: string;
    installments?: number;
  }): Promise<WompiTransaction> {
    try {
      const acceptanceToken = await this.getAcceptanceToken();
      const amountInCents = Math.round(params.amount * 100); // Convert to cents
      const currency = 'COP';

      // Generate integrity signature
      const integritySignature = this.generateIntegritySignature(
        params.reference,
        amountInCents,
        currency
      );

      const transactionData: WompiTransactionRequest = {
        amount_in_cents: amountInCents,
        currency,
        customer_email: String(params.customerEmail),
        reference: String(params.reference),
        payment_method: {
          type: WompiPaymentMethod.CARD,
          token: String(params.cardToken),
          installments: params.installments || 1,
        },
        customer_data: {
          full_name: String(params.customerName),
          legal_id: String(params.customerDocument),
          legal_id_type: String(params.customerDocumentType || 'CC'),
        },
      };

      logger.info({ transactionData }, 'Creating card transaction');

      const response = await this.client.post('/transactions', {
        ...transactionData,
        acceptance_token: String(acceptanceToken),
        signature: String(integritySignature),
      });

      logger.info(`Card transaction created: ${response.data.data.id}`);
      return response.data.data;
    } catch (error: any) {
      logger.error({ err: error, responseData: error.response?.data }, 'Error creating card transaction');

      // Extract error message from various Wompi error formats
      const errorData = error.response?.data?.error;
      let errorMessage = 'Failed to create card transaction';

      if (errorData) {
        if (errorData.messages && typeof errorData.messages === 'object') {
          // Handle validation errors with field-specific messages
          const fieldErrors: string[] = [];
          for (const [field, messages] of Object.entries(errorData.messages)) {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            fieldErrors.push(`${field}: ${msgArray.join(', ')}`);
          }
          errorMessage = fieldErrors.join('; ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.reason) {
          errorMessage = errorData.reason;
        } else if (errorData.type) {
          errorMessage = `${errorData.type}: ${JSON.stringify(errorData)}`;
        }
      }

      throw new AppError(errorMessage, 400);
    }
  }

  /**
   * Get list of PSE financial institutions (banks)
   */
  async getPSEBanks(): Promise<WompiBank[]> {
    try {
      const response = await this.client.get('/pse/financial_institutions');
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting PSE banks:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || 'Failed to get PSE banks', 400);
    }
  }

  /**
   * Create a PSE transaction
   */
  async createPSETransaction(params: {
    amount: number;
    reference: string;
    customerEmail: string;
    customerName: string;
    customerDocument: string;
    customerDocumentType: string;
    financialInstitutionCode: string;
    userType: number; // 0 = persona natural, 1 = persona jurídica
    redirectUrl: string;
  }): Promise<WompiTransaction> {
    try {
      const acceptanceToken = await this.getAcceptanceToken();
      const amountInCents = Math.round(params.amount * 100);
      const currency = 'COP';

      // Generate integrity signature
      const integritySignature = this.generateIntegritySignature(
        params.reference,
        amountInCents,
        currency
      );

      const transactionData: WompiTransactionRequest = {
        amount_in_cents: amountInCents,
        currency,
        customer_email: String(params.customerEmail),
        reference: String(params.reference),
        redirect_url: String(params.redirectUrl),
        payment_method: {
          type: WompiPaymentMethod.PSE,
          user_type: params.userType,
          user_legal_id_type: String(params.customerDocumentType),
          user_legal_id: String(params.customerDocument),
          financial_institution_code: String(params.financialInstitutionCode),
          payment_description: `Inversión ${params.reference}`,
        },
        customer_data: {
          full_name: String(params.customerName),
          legal_id: String(params.customerDocument),
          legal_id_type: String(params.customerDocumentType),
        },
      };

      logger.info({ transactionData }, 'Creating PSE transaction');

      const response = await this.client.post('/transactions', {
        ...transactionData,
        acceptance_token: String(acceptanceToken),
        signature: String(integritySignature),
      });

      logger.info(`PSE transaction created: ${response.data.data.id}`);
      return response.data.data;
    } catch (error: any) {
      logger.error({ err: error, responseData: error.response?.data }, 'Error creating PSE transaction');

      // Extract error message from various Wompi error formats
      const errorData = error.response?.data?.error;
      let errorMessage = 'Failed to create PSE transaction';

      if (errorData) {
        if (errorData.messages && typeof errorData.messages === 'object') {
          const fieldErrors: string[] = [];
          for (const [field, messages] of Object.entries(errorData.messages)) {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            fieldErrors.push(`${field}: ${msgArray.join(', ')}`);
          }
          errorMessage = fieldErrors.join('; ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.reason) {
          errorMessage = errorData.reason;
        } else if (errorData.type) {
          errorMessage = `${errorData.type}: ${JSON.stringify(errorData)}`;
        }
      }

      throw new AppError(errorMessage, 400);
    }
  }

  /**
   * Create a Bancolombia Transfer transaction
   */
  async createBancolombiaTransaction(params: {
    amount: number;
    reference: string;
    customerEmail: string;
    redirectUrl: string;
  }): Promise<WompiTransaction> {
    try {
      const acceptanceToken = await this.getAcceptanceToken();
      const amountInCents = Math.round(params.amount * 100);
      const currency = 'COP';

      // Generate integrity signature
      const integritySignature = this.generateIntegritySignature(
        params.reference,
        amountInCents,
        currency
      );

      const transactionData: WompiTransactionRequest = {
        amount_in_cents: amountInCents,
        currency,
        customer_email: String(params.customerEmail),
        reference: String(params.reference),
        redirect_url: String(params.redirectUrl),
        payment_method: {
          type: WompiPaymentMethod.BANCOLOMBIA_TRANSFER,
          user_type: 'PERSON',
          payment_description: `Inversión ${params.reference}`,
        },
      };

      logger.info({ transactionData }, 'Creating Bancolombia transaction');

      const response = await this.client.post('/transactions', {
        ...transactionData,
        acceptance_token: String(acceptanceToken),
        signature: String(integritySignature),
      });

      logger.info(`Bancolombia transaction created: ${response.data.data.id}`);
      return response.data.data;
    } catch (error: any) {
      logger.error({ err: error, responseData: error.response?.data }, 'Error creating Bancolombia transaction');

      // Extract error message - log full response for debugging
      const fullError = JSON.stringify(error.response?.data, null, 2);
      logger.error(`Full Wompi error response: ${fullError}`);

      const errorData = error.response?.data?.error;
      let errorMessage = 'Failed to create Bancolombia transaction';

      if (errorData) {
        if (errorData.messages && typeof errorData.messages === 'object') {
          // Flatten nested error messages
          const flattenMessages = (obj: any, prefix = ''): string[] => {
            const results: string[] = [];
            for (const [key, value] of Object.entries(obj)) {
              const fullKey = prefix ? `${prefix}.${key}` : key;
              if (Array.isArray(value)) {
                results.push(`${fullKey}: ${value.join(', ')}`);
              } else if (typeof value === 'object' && value !== null) {
                results.push(...flattenMessages(value, fullKey));
              } else {
                results.push(`${fullKey}: ${value}`);
              }
            }
            return results;
          };
          errorMessage = flattenMessages(errorData.messages).join('; ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.reason) {
          errorMessage = errorData.reason;
        } else if (errorData.type) {
          errorMessage = `${errorData.type}: ${JSON.stringify(errorData)}`;
        }
      }

      throw new AppError(errorMessage, 400);
    }
  }

  /**
   * Create a Nequi transaction
   */
  async createNequiTransaction(params: {
    amount: number;
    reference: string;
    customerEmail: string;
    phoneNumber: string;
  }): Promise<WompiTransaction> {
    try {
      const acceptanceToken = await this.getAcceptanceToken();
      const amountInCents = Math.round(params.amount * 100);
      const currency = 'COP';

      // Generate integrity signature
      const integritySignature = this.generateIntegritySignature(
        params.reference,
        amountInCents,
        currency
      );

      const transactionData: WompiTransactionRequest = {
        amount_in_cents: amountInCents,
        currency,
        customer_email: params.customerEmail,
        reference: params.reference,
        payment_method: {
          type: WompiPaymentMethod.NEQUI,
          payment_description: `Inversión ${params.reference}`,
        },
        customer_data: {
          phone_number: params.phoneNumber,
        },
      };

      const response = await this.client.post('/transactions', {
        ...transactionData,
        acceptance_token: acceptanceToken,
        signature: integritySignature,
      });

      logger.info(`Nequi transaction created: ${response.data.data.id}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error creating Nequi transaction:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || 'Failed to create Nequi transaction', 400);
    }
  }

  /**
   * Get transaction status
   */
  async getTransaction(transactionId: string): Promise<WompiTransaction> {
    try {
      const response = await this.client.get(`/transactions/${transactionId}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting transaction:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || 'Failed to get transaction', 400);
    }
  }

  /**
   * Void/cancel a transaction
   */
  async voidTransaction(transactionId: string): Promise<WompiTransaction> {
    try {
      const response = await this.client.post(`/transactions/${transactionId}/void`);
      logger.info(`Transaction voided: ${transactionId}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error voiding transaction:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || 'Failed to void transaction', 400);
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(event: WompiWebhookEvent): boolean {
    try {
      const { signature, data, timestamp } = event;
      const transaction = data.transaction;

      // Build the string to hash based on signature properties
      const properties = signature.properties;
      let stringToHash = '';

      for (const prop of properties) {
        const keys = prop.split('.');
        let value: any = { transaction };
        for (const key of keys) {
          value = value[key];
        }
        stringToHash += value;
      }

      stringToHash += timestamp + this.eventsSecret;

      // Generate SHA256 hash
      const generatedChecksum = crypto
        .createHash('sha256')
        .update(stringToHash)
        .digest('hex');

      return generatedChecksum === signature.checksum;
    } catch (error) {
      logger.error({ err: error }, 'Error validating webhook signature');
      return false;
    }
  }

  /**
   * Generate integrity signature for frontend
   */
  generateIntegritySignature(reference: string, amountInCents: number, currency: string = 'COP'): string {
    const stringToHash = `${reference}${amountInCents}${currency}${this.integritySecret}`;
    return crypto.createHash('sha256').update(stringToHash).digest('hex');
  }

  /**
   * Get public key for frontend
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  // ============================================
  // DISBURSEMENT (PAYOUT) METHODS
  // ============================================

  /**
   * Create a disbursement (payout) to a bank account
   * This sends money TO a user's bank account
   */
  async createDisbursement(params: {
    amount: number;
    reference: string;
    bankCode: string;
    accountType: 'savings' | 'checking';
    accountNumber: string;
    accountHolderName: string;
    documentType: string;
    documentNumber: string;
    description?: string;
  }): Promise<WompiDisbursement> {
    try {
      const amountInCents = Math.round(params.amount * 100);

      const disbursementData: WompiDisbursementRequest = {
        amount_in_cents: amountInCents,
        currency: 'COP',
        reference: params.reference,
        bank_account: {
          bank_code: params.bankCode,
          account_type: params.accountType === 'savings' ? 'SAVINGS' : 'CHECKING',
          account_number: params.accountNumber,
          account_holder_name: params.accountHolderName,
          account_holder_document_type: params.documentType.toUpperCase(),
          account_holder_document_number: params.documentNumber,
        },
        description: params.description || `Payout ${params.reference}`,
      };

      logger.info({ disbursementData: { ...disbursementData, bank_account: { ...disbursementData.bank_account, account_number: '****' } } }, 'Creating Wompi disbursement');

      const response = await this.client.post('/disbursements', disbursementData);

      logger.info(`Wompi disbursement created: ${response.data.data.id}`);
      return response.data.data;
    } catch (error: any) {
      logger.error({ err: error, responseData: error.response?.data }, 'Error creating Wompi disbursement');

      const errorData = error.response?.data?.error;
      let errorMessage = 'Failed to create disbursement';

      if (errorData) {
        if (errorData.messages && typeof errorData.messages === 'object') {
          const fieldErrors: string[] = [];
          for (const [field, messages] of Object.entries(errorData.messages)) {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            fieldErrors.push(`${field}: ${msgArray.join(', ')}`);
          }
          errorMessage = fieldErrors.join('; ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.reason) {
          errorMessage = errorData.reason;
        }
      }

      throw new AppError(errorMessage, 400);
    }
  }

  /**
   * Get disbursement status
   */
  async getDisbursement(disbursementId: string): Promise<WompiDisbursement> {
    try {
      const response = await this.client.get(`/disbursements/${disbursementId}`);
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting disbursement:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || 'Failed to get disbursement', 400);
    }
  }

  /**
   * Get list of banks available for disbursements
   */
  async getDisbursementBanks(): Promise<WompiBank[]> {
    try {
      // Use the same endpoint as PSE banks for Colombian banks
      const response = await this.client.get('/pse/financial_institutions');
      return response.data.data;
    } catch (error: any) {
      logger.error('Error getting disbursement banks:', error.response?.data || error.message);
      throw new AppError(error.response?.data?.error?.message || 'Failed to get banks', 400);
    }
  }

  /**
   * Colombian bank codes reference
   */
  static readonly COLOMBIAN_BANKS: Record<string, string> = {
    '001': 'Banco de Bogotá',
    '002': 'Banco Popular',
    '006': 'Banco Corpbanca',
    '007': 'Bancolombia',
    '009': 'Citibank',
    '012': 'Banco GNB Sudameris',
    '013': 'BBVA Colombia',
    '019': 'Banco Colpatria',
    '023': 'Banco de Occidente',
    '031': 'Bancoldex',
    '032': 'BCSC',
    '040': 'Banco Agrario',
    '041': 'Banco Davivienda',
    '042': 'Banco AV Villas',
    '051': 'Banco Caja Social',
    '052': 'Banco Falabella',
    '053': 'Banco Finandina',
    '054': 'Banco W',
    '055': 'Banco Pichincha',
    '056': 'Bancoomeva',
    '057': 'Banco Itaú',
    '058': 'Banco Santander',
    '059': 'Banco Mundo Mujer',
    '060': 'Banco Multibank',
    '061': 'Banco Bancompartir',
    '062': 'Banco Coopcentral',
    '063': 'Banco Serfinanza',
    '065': 'Banco Coomeva',
    '066': 'Banco Compartir',
    '067': 'Lulo Bank',
    '068': 'Banco Pibank',
    '069': 'Banco J.P. Morgan',
    '070': 'Dale',
    '071': 'Rappipay',
    '072': 'Movii',
    '073': 'Nequi',
    '074': 'Daviplata',
    '075': 'Banco Nu Colombia',
  };

  /**
   * Get subscription checkout info (returns data for frontend to display payment form)
   */
  getSubscriptionCheckoutInfo(params: {
    planKey: string;
    planName: string;
    amount: number;
    billingCycle: 'monthly' | 'annual';
    reference: string;
  }): {
    reference: string;
    amount: number;
    amountInCents: number;
    currency: string;
    planName: string;
    billingCycle: string;
    publicKey: string;
    integritySignature: string;
  } {
    const amountInCents = Math.round(params.amount * 100);
    const currency = 'COP';
    const integritySignature = this.generateIntegritySignature(params.reference, amountInCents, currency);

    return {
      reference: params.reference,
      amount: params.amount,
      amountInCents,
      currency,
      planName: params.planName,
      billingCycle: params.billingCycle,
      publicKey: this.publicKey,
      integritySignature,
    };
  }

  /**
   * Create subscription with card payment
   */
  async createSubscriptionCardTransaction(params: {
    planKey: string;
    planName: string;
    amount: number;
    billingCycle: 'monthly' | 'annual';
    reference: string;
    customerEmail: string;
    customerName: string;
    customerDocument: string;
    customerDocumentType?: string;
    cardToken: string;
    installments?: number;
    userId: string;
  }): Promise<WompiTransaction> {
    try {
      const acceptanceToken = await this.getAcceptanceToken();
      const amountInCents = Math.round(params.amount * 100);
      const currency = 'COP';

      // Generate integrity signature
      const integritySignature = this.generateIntegritySignature(
        params.reference,
        amountInCents,
        currency
      );

      const transactionData: WompiTransactionRequest = {
        amount_in_cents: amountInCents,
        currency,
        customer_email: String(params.customerEmail),
        reference: String(params.reference),
        payment_method: {
          type: WompiPaymentMethod.CARD,
          token: String(params.cardToken),
          installments: params.installments || 1,
        },
        customer_data: {
          full_name: String(params.customerName),
          legal_id: String(params.customerDocument),
          legal_id_type: String(params.customerDocumentType || 'CC'),
        },
      };

      logger.info({ transactionData }, 'Creating subscription card transaction');

      const response = await this.client.post('/transactions', {
        ...transactionData,
        acceptance_token: String(acceptanceToken),
        signature: String(integritySignature),
      });

      logger.info(`Subscription card transaction created: ${response.data.data.id}`);
      return response.data.data;
    } catch (error: any) {
      logger.error({ err: error, responseData: error.response?.data }, 'Error creating subscription card transaction');

      const errorData = error.response?.data?.error;
      let errorMessage = 'Failed to create subscription payment';

      if (errorData) {
        if (errorData.messages && typeof errorData.messages === 'object') {
          const fieldErrors: string[] = [];
          for (const [field, messages] of Object.entries(errorData.messages)) {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            fieldErrors.push(`${field}: ${msgArray.join(', ')}`);
          }
          errorMessage = fieldErrors.join('; ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.reason) {
          errorMessage = errorData.reason;
        }
      }

      throw new AppError(errorMessage, 400);
    }
  }
}

export const wompiService = new WompiService();
