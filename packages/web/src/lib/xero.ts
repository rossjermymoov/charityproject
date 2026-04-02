/**
 * Xero Integration Utilities
 *
 * This module provides utilities for syncing financial data (donations, contacts)
 * to Xero cloud accounting system via OAuth 2.0 and REST API.
 */

// ── Constants ────────────────────────────────────────────────────

export const XERO_CONFIG = {
  AUTHORIZE_URL: "https://login.xero.com/identity/connect/authorize",
  TOKEN_URL: "https://identity.xero.com/connect/token",
  API_BASE_URL: "https://api.xero.com/api.xro/2.0",
  SCOPES: [
    "offline_access",
    "payroll.payroll",
    "payroll.settings",
    "files",
    "accounting",
    "contacts",
  ],
} as const;

export const XERO_ENDPOINTS = {
  CONTACTS: "/Contacts",
  INVOICES: "/Invoices",
  PAYMENTS: "/Payments",
  ACCOUNTS: "/Accounts",
  ORGANISATIONS: "/Organisations",
} as const;

// ── Type Definitions ────────────────────────────────────────────

export interface XeroAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface XeroTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  expiresAt: Date;
}

export interface XeroContact {
  ContactID?: string;
  ContactName: string;
  EmailAddress?: string;
  FirstName?: string;
  LastName?: string;
  SkypeUserName?: string;
  PhoneNumber?: string;
  FaxNumber?: string;
  Website?: string;
  Addresses?: XeroAddress[];
  ContactGroups?: XeroContactGroup[];
  Contacts?: XeroContact[];
  DefaultCurrency?: string;
  ContactStatus?: "ACTIVE" | "ARCHIVED" | "GDPRREQUEST";
}

export interface XeroAddress {
  AddressType: "STREET" | "POBOX" | "DELIVERY";
  City?: string;
  Region?: string;
  PostalCode?: string;
  Country?: string;
  AttentionTo?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  AddressLine3?: string;
  AddressLine4?: string;
}

export interface XeroContactGroup {
  Name: string;
  Contacts?: XeroContact[];
}

export interface XeroInvoice {
  InvoiceID?: string;
  InvoiceNumber?: string;
  ContactID?: string;
  Contact?: XeroContact;
  Type: "ACCREC" | "ACCPAY";
  Status?: "DRAFT" | "SUBMITTED" | "PAID" | "AUTHORISED";
  Date: string; // YYYY-MM-DD
  DueDate?: string;
  DeliveryDate?: string;
  LineItems: XeroLineItem[];
  Reference?: string;
  CurrencyCode?: string;
  BrandingThemeID?: string;
  Total?: number;
  Tax?: number;
  AmountDue?: number;
}

export interface XeroLineItem {
  Description: string;
  Quantity?: number;
  UnitAmount?: number;
  AccountCode: string;
  TaxType?: string;
  LineAmount?: number;
  Tracking?: XeroTrackingCategory[];
}

export interface XeroTrackingCategory {
  Name: string;
  Option: string;
}

export interface XeroPayment {
  PaymentID?: string;
  InvoiceID?: string;
  Contact?: XeroContact;
  Account?: XeroAccount;
  PaymentType: "ARCREDITPAYMENT" | "APCREDITPAYMENT" | "ARRECEIPT" | "APPAYMENT";
  Status?: "DRAFT" | "SUBMITTED" | "AUTHORISED";
  Date: string; // YYYY-MM-DD
  Amount: number;
  Reference?: string;
  IsReconciled?: boolean;
}

export interface XeroAccount {
  AccountID?: string;
  Code: string;
  Name: string;
  Type:
    | "BANK"
    | "CURRENT"
    | "LIABILITY"
    | "EQUITY"
    | "EXPENSE"
    | "REVENUE"
    | "OVERHEADS"
    | "DEPRECIATION";
  TaxType?: string;
  Description?: string;
  EnablePaymentsToAccount?: boolean;
  ShowInExpensesClaims?: boolean;
  Status?: "ACTIVE" | "ARCHIVED" | "DELETED";
  CurrencyCode?: string;
  SystemAccount?: string;
  Class?: string;
  EnablePaymentsFromAccount?: boolean;
  UpdatedDateUTC?: string;
  HasAttachments?: boolean;
}

export interface XeroOrganisation {
  OrganisationID?: string;
  APIKey?: string;
  Name: string;
  LegalName?: string;
  PaysTax?: boolean;
  Version?: string;
  OrganisationType?:
    | "INDIVIDUAL"
    | "PARTNERSHIP"
    | "COMPANY"
    | "TRUST"
    | "CHARITY"
    | "PUBLIC_SERVICE"
    | "NOPROFIT"
    | "CLUB"
    | "COOP"
    | "UNINCORP_ASSOC"
    | "UNKNOWN";
  BaseCurrency?: string;
  CountryCode?: string;
  IsDemoCompany?: boolean;
  OrganisationStatus?: "ACTIVE" | "SUSPENDED";
  FinancialYearEndDay?: number;
  FinancialYearEndMonth?: number;
  SalesTaxBasis?:
    | "PAYMENTS"
    | "ACCRUALS"
    | "FLATRATE"
    | "CASH"
    | "ACCRUALS_EXEMPT"
    | "CASH_EXEMPT"
    | "ACCRUALS_TAX_ON_PAYMENTS"
    | "PAYMENTS_TAX_ON_PAYMENTS"
    | "NO_SALESUSE_TAX";
  SalesTaxPeriod?:
    | "MONTHLY"
    | "QUARTERLY"
    | "ANNUALLY"
    | "UNKNOWN"
    | "SIXMONTHLY";
  DefaultSalesTaxCode?: string;
  DefaultPurchaseTaxCode?: string;
  PeriodLockDate?: string;
  EndOfYearLockDate?: string;
  CreatedDateUTC?: string;
  Timezone?: string;
  ShortCode?: string;
  LineOfApproximateExpenses?: string;
  Addresses?: XeroAddress[];
  Phones?: XeroPhone[];
  ExternalLinks?: XeroExternalLink[];
}

export interface XeroPhone {
  PhoneType: "DEFAULT" | "DDI" | "MOBILE" | "FAX";
  PhoneNumber?: string;
  PhoneAreaCode?: string;
  PhoneCountryCode?: string;
}

export interface XeroExternalLink {
  LinkType?: string;
  Url?: string;
}

export interface XeroAPIResponse<T> {
  Status: "OK" | "AUTHORISED";
  ProviderName?: string;
  ApiSet?: string;
  ApiMaxItems?: number;
  ApiVersion?: string;
  Id?: string;
  DateTime?: string;
  Items?: T[];
  Exceptions?: XeroException[];
  ValidationErrors?: XeroValidationError[];
}

export interface XeroException {
  ApiExceptionCode: string;
  ApiExceptionMessage: string;
}

export interface XeroValidationError {
  Message: string;
}

export interface DonationSyncData {
  donationId: string;
  contactId: string;
  amount: number;
  currency: string;
  date: Date;
  donorName: string;
  donorEmail?: string;
  donationType: string;
  campaignName?: string;
  ledgerCodeId?: string;
  xeroAccountCode?: string;
  method?: string;
  reference?: string;
}

export interface ContactSyncData {
  contactId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

// ── OAuth URL Generation ────────────────────────────────────────

/**
 * Generate the OAuth authorization URL for Xero login
 */
export function generateAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: XERO_CONFIG.SCOPES.join(" "),
    state: state,
  });

  return `${XERO_CONFIG.AUTHORIZE_URL}?${params.toString()}`;
}

// ── Token Exchange & Refresh ────────────────────────────────────

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(
  config: XeroAuthConfig,
  code: string
): Promise<XeroTokens> {
  try {
    const response = await fetch(XERO_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "CharityOS-Xero-Integration",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 3600,
      tokenType: data.token_type || "Bearer",
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  } catch (error) {
    console.error("Xero token exchange error:", error);
    throw error;
  }
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
  config: XeroAuthConfig,
  refreshToken: string
): Promise<XeroTokens> {
  try {
    const response = await fetch(XERO_CONFIG.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "CharityOS-Xero-Integration",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in || 3600,
      tokenType: data.token_type || "Bearer",
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
    };
  } catch (error) {
    console.error("Xero token refresh error:", error);
    throw error;
  }
}

// ── API Requests ────────────────────────────────────────────────

/**
 * Make authenticated API request to Xero with automatic token refresh
 */
export async function makeXeroRequest<T = unknown>(
  method: "GET" | "POST" | "PUT",
  endpoint: string,
  accessToken: string,
  tenantId: string,
  body?: Record<string, unknown>
): Promise<T> {
  try {
    const url = `${XERO_CONFIG.API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Xero-tenant-id": tenantId,
        "Content-Type": "application/json",
        "User-Agent": "CharityOS-Xero-Integration",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      throw new Error("Unauthorized - token may be expired");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Xero API error: ${response.status} - ${JSON.stringify(error)}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Xero ${method} ${endpoint} error:`, error);
    throw error;
  }
}

// ── Contact Sync ────────────────────────────────────────────────

/**
 * Create or update a contact in Xero
 */
export async function syncContactToXero(
  accessToken: string,
  tenantId: string,
  contact: ContactSyncData
): Promise<string | null> {
  try {
    const xeroContact: XeroContact = {
      ContactName: contact.name,
      EmailAddress: contact.email,
      PhoneNumber: contact.phone,
      Addresses: contact.address
        ? [
            {
              AddressType: "STREET",
              City: contact.city,
              PostalCode: contact.postcode,
              Country: contact.country,
              AddressLine1: contact.address,
            },
          ]
        : undefined,
      ContactStatus: "ACTIVE",
    };

    const response = await makeXeroRequest<XeroAPIResponse<XeroContact>>(
      "POST",
      XERO_ENDPOINTS.CONTACTS,
      accessToken,
      tenantId,
      { Contacts: [xeroContact] }
    );

    const createdContact = response?.Contacts?.[0];
    return createdContact?.ContactID || null;
  } catch (error) {
    console.error("Error syncing contact to Xero:", error);
    throw error;
  }
}

/**
 * Fetch a contact from Xero by email
 */
export async function fetchXeroContactByEmail(
  accessToken: string,
  tenantId: string,
  email: string
): Promise<XeroContact | null> {
  try {
    const response = await makeXeroRequest<XeroAPIResponse<XeroContact>>(
      "GET",
      `${XERO_ENDPOINTS.CONTACTS}?where=EmailAddress="${email.replace(/"/g, '\\"')}"`,
      accessToken,
      tenantId
    );

    return response?.Contacts?.[0] || null;
  } catch (error) {
    console.error("Error fetching contact from Xero:", error);
    return null;
  }
}

// ── Invoice & Payment Sync ──────────────────────────────────────

/**
 * Create an invoice in Xero from a donation
 */
export async function createXeroInvoiceFromDonation(
  accessToken: string,
  tenantId: string,
  donation: DonationSyncData,
  contactXeroId: string
): Promise<string | null> {
  try {
    const invoice: XeroInvoice = {
      Type: "ACCREC",
      ContactID: contactXeroId,
      Date: donation.date.toISOString().split("T")[0],
      LineItems: [
        {
          Description: `Donation: ${donation.donationType}${
            donation.campaignName ? ` - ${donation.campaignName}` : ""
          }`,
          Quantity: 1,
          UnitAmount: donation.amount,
          AccountCode:
            donation.xeroAccountCode || "200", // Default to revenue account
          TaxType: "Tax on Sales",
        },
      ],
      Reference: donation.reference || donation.donationId,
      CurrencyCode: donation.currency,
    };

    const response = await makeXeroRequest<XeroAPIResponse<XeroInvoice>>(
      "POST",
      XERO_ENDPOINTS.INVOICES,
      accessToken,
      tenantId,
      { Invoices: [invoice] }
    );

    const createdInvoice = response?.Invoices?.[0];
    return createdInvoice?.InvoiceID || null;
  } catch (error) {
    console.error("Error creating invoice in Xero:", error);
    throw error;
  }
}

/**
 * Create a payment in Xero for an invoice
 */
export async function createXeroPaymentForInvoice(
  accessToken: string,
  tenantId: string,
  invoiceXeroId: string,
  amount: number,
  date: Date,
  accountCode: string = "200" // Default bank account
): Promise<string | null> {
  try {
    const payment: XeroPayment = {
      InvoiceID: invoiceXeroId,
      PaymentType: "ARRECEIPT",
      Date: date.toISOString().split("T")[0],
      Amount: amount,
    };

    const response = await makeXeroRequest<XeroAPIResponse<XeroPayment>>(
      "POST",
      XERO_ENDPOINTS.PAYMENTS,
      accessToken,
      tenantId,
      { Payments: [payment] }
    );

    const createdPayment = response?.Payments?.[0];
    return createdPayment?.PaymentID || null;
  } catch (error) {
    console.error("Error creating payment in Xero:", error);
    throw error;
  }
}

// ── Chart of Accounts ────────────────────────────────────────────

/**
 * Fetch all active accounts (chart of accounts) from Xero
 */
export async function fetchXeroChartOfAccounts(
  accessToken: string,
  tenantId: string
): Promise<XeroAccount[]> {
  try {
    const response = await makeXeroRequest<XeroAPIResponse<XeroAccount>>(
      "GET",
      `${XERO_ENDPOINTS.ACCOUNTS}?where=Status=="ACTIVE"`,
      accessToken,
      tenantId
    );

    return response?.Accounts || [];
  } catch (error) {
    console.error("Error fetching chart of accounts from Xero:", error);
    throw error;
  }
}

// ── Organisation Details ────────────────────────────────────────

/**
 * Fetch organisation details from Xero
 */
export async function fetchXeroOrganisation(
  accessToken: string,
  tenantId: string
): Promise<XeroOrganisation | null> {
  try {
    const response = await makeXeroRequest<XeroAPIResponse<XeroOrganisation>>(
      "GET",
      XERO_ENDPOINTS.ORGANISATIONS,
      accessToken,
      tenantId
    );

    return response?.Organisations?.[0] || null;
  } catch (error) {
    console.error("Error fetching organisation from Xero:", error);
    return null;
  }
}

// ── Error Handling ──────────────────────────────────────────────

export class XeroError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "XeroError";
  }
}

export function isXeroError(error: unknown): error is XeroError {
  return error instanceof XeroError;
}
