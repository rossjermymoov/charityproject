/**
 * Dotdigital API Client
 * Two-way sync with Dotdigital for contacts and address books
 */

export interface DotdigitalAddressBook {
  id: number;
  name: string;
  contacts: number;
  visibility: string;
  created: string;
}

export interface DotdigitalAddressBookResponse {
  list: DotdigitalAddressBook[];
}

export interface DotdigitalContact {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  dateCreated: string;
  [key: string]: any;
}

export interface DotdigitalContactResponse {
  list: DotdigitalContact[];
  pageSize: number;
  pageNumber: number;
  totalPageCount: number;
}

export interface DotdigitalUpsertContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  customFields?: Record<string, string>;
}

export interface DotdigitalSyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: Array<{ email?: string; message: string }>;
}

/**
 * DotdigitalClient - wrapper around Dotdigital Engagement Cloud API v2
 */
export class DotdigitalClient {
  private apiUser: string;
  private apiPassword: string;
  private apiEndpoint: string;

  constructor(apiUser: string, apiPassword: string, apiEndpoint?: string) {
    this.apiUser = apiUser;
    this.apiPassword = apiPassword;
    this.apiEndpoint = apiEndpoint || "https://api.dotdigital.com";
  }

  private getHeaders() {
    const auth = Buffer.from(`${this.apiUser}:${this.apiPassword}`).toString("base64");
    return {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Fetch all address books
   */
  async getAddressBooks(): Promise<DotdigitalAddressBook[] | null> {
    try {
      const response = await fetch(`${this.apiEndpoint}/v2/address-books`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error("Failed to fetch Dotdigital address books:", response.statusText);
        return null;
      }

      const data: DotdigitalAddressBookResponse = await response.json();
      return data.list || [];
    } catch (error) {
      console.error("Error fetching Dotdigital address books:", error);
      return null;
    }
  }

  /**
   * Fetch contacts from an address book
   */
  async getContacts(
    addressBookId: number,
    pageNumber = 1,
    pageSize = 100
  ): Promise<DotdigitalContactResponse | null> {
    try {
      const params = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(
        `${this.apiEndpoint}/v2/address-books/${addressBookId}/contacts?${params}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch Dotdigital contacts:", response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching Dotdigital contacts:", error);
      return null;
    }
  }

  /**
   * Get contact by email
   */
  async getContactByEmail(email: string): Promise<DotdigitalContact | null> {
    try {
      const response = await fetch(`${this.apiEndpoint}/v2/contacts?email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.list?.[0] || null;
    } catch (error) {
      console.error("Error fetching Dotdigital contact:", error);
      return null;
    }
  }

  /**
   * Create or update a contact
   */
  async upsertContact(
    contact: DotdigitalUpsertContact,
    addressBookId: number
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      // First try to get existing contact
      const existingContact = await this.getContactByEmail(contact.email);

      const contactData = {
        email: contact.email,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        phone: contact.phone || "",
        customFields: contact.customFields || [],
      };

      if (existingContact) {
        // Update existing contact
        const response = await fetch(`${this.apiEndpoint}/v2/contacts/${existingContact.id}`, {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(contactData),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            success: false,
            error: error.message || "Failed to update contact",
          };
        }

        const result = await response.json();
        return {
          success: true,
          id: result.id,
        };
      } else {
        // Create new contact
        const response = await fetch(`${this.apiEndpoint}/v2/contacts`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(contactData),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            success: false,
            error: error.message || "Failed to create contact",
          };
        }

        const result = await response.json();

        // Add to address book if created successfully
        if (result.id && addressBookId) {
          await this.addContactToAddressBook(result.id, addressBookId);
        }

        return {
          success: true,
          id: result.id,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Add contact to address book
   */
  async addContactToAddressBook(contactId: number, addressBookId: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiEndpoint}/v2/address-books/${addressBookId}/contacts`,
        {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({ id: contactId }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error adding contact to address book:", error);
      return false;
    }
  }

  /**
   * Remove contact from address book
   */
  async removeContactFromAddressBook(contactId: number, addressBookId: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiEndpoint}/v2/address-books/${addressBookId}/contacts/${contactId}`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        }
      );

      return response.ok || response.status === 404; // 404 is acceptable
    } catch (error) {
      console.error("Error removing contact from address book:", error);
      return false;
    }
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/v2/account/info`, {
        method: "GET",
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Demo mode for Dotdigital - returns mock data when no API key is present
 */
export class DotdigitalDemoClient extends DotdigitalClient {
  constructor() {
    super("demo@example.com", "demo-password");
  }

  async getAddressBooks(): Promise<DotdigitalAddressBook[] | null> {
    return [
      {
        id: 1,
        name: "Demo Newsletter",
        contacts: 500,
        visibility: "private",
        created: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Demo Donors",
        contacts: 250,
        visibility: "private",
        created: new Date().toISOString(),
      },
    ];
  }

  async getContacts(): Promise<DotdigitalContactResponse | null> {
    return {
      list: [
        {
          id: 1,
          email: "jane.smith@example.com",
          firstName: "Jane",
          lastName: "Smith",
          phone: "555-1234",
          status: "Active",
          dateCreated: new Date().toISOString(),
        },
      ],
      pageSize: 100,
      pageNumber: 1,
      totalPageCount: 1,
    };
  }

  async getContactByEmail(): Promise<DotdigitalContact | null> {
    return {
      id: 1,
      email: "jane.smith@example.com",
      firstName: "Jane",
      lastName: "Smith",
      phone: "555-1234",
      status: "Active",
      dateCreated: new Date().toISOString(),
    };
  }

  async upsertContact(): Promise<{ success: boolean; id?: number; error?: string }> {
    return {
      success: true,
      id: Math.floor(Math.random() * 10000),
    };
  }

  async addContactToAddressBook(): Promise<boolean> {
    return true;
  }

  async removeContactFromAddressBook(): Promise<boolean> {
    return true;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
