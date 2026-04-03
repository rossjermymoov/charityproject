/**
 * Mailchimp API Client
 * Two-way sync with Mailchimp for contacts and lists
 */

export interface MailchimpListResponse {
  lists: Array<{
    id: string;
    name: string;
    contact: {
      company: string;
      address1: string;
      city: string;
      state: string;
      zip: string;
      country: string;
      phone: string;
    };
    stats: {
      member_count: number;
    };
  }>;
}

export interface MailchimpMember {
  id: string;
  email_address: string;
  unique_email_id: string;
  email_type: string;
  status: string; // "subscribed" | "unsubscribed" | "cleaned" | "pending"
  merge_fields: Record<string, any>;
  timestamp_signup: string;
  timestamp_opt: string;
  member_rating: number;
  last_changed: string;
}

export interface MailchimpMemberResponse {
  members: MailchimpMember[];
  list_id: string;
}

export interface MailchimpContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  [key: string]: any;
}

export interface MailchimpSyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: Array<{ email?: string; message: string }>;
}

/**
 * MailchimpClient - wrapper around Mailchimp API v3
 */
export class MailchimpClient {
  private apiKey: string;
  private listId: string;
  private dataCenter: string;

  constructor(apiKey: string, listId: string) {
    this.apiKey = apiKey;
    this.listId = listId;
    // Extract data center from API key (e.g., "us1" from "xxxxx-us1")
    this.dataCenter = apiKey.split("-")[1] || "us1";
  }

  private getHeaders() {
    const auth = Buffer.from(`anystring:${this.apiKey}`).toString("base64");
    return {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    };
  }

  private getBaseUrl() {
    return `https://${this.dataCenter}.api.mailchimp.com/3.0`;
  }

  /**
   * Fetch all lists available in this account
   */
  async getLists(): Promise<MailchimpListResponse | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/lists`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error("Failed to fetch Mailchimp lists:", response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching Mailchimp lists:", error);
      return null;
    }
  }

  /**
   * Fetch all members from the configured list
   */
  async getMembers(status: string = "subscribed", offset = 0, count = 100): Promise<MailchimpMemberResponse | null> {
    try {
      const params = new URLSearchParams({
        status,
        offset: offset.toString(),
        count: count.toString(),
        fields: "members.id,members.email_address,members.status,members.merge_fields,members.timestamp_signup",
      });

      const response = await fetch(`${this.getBaseUrl()}/lists/${this.listId}/members?${params}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error("Failed to fetch Mailchimp members:", response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching Mailchimp members:", error);
      return null;
    }
  }

  /**
   * Add or update a member in the list
   */
  async upsertMember(contact: MailchimpContact): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const email = contact.email.toLowerCase();
      const subscriberHash = this.hashEmail(email);

      const memberData = {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: contact.firstName || "",
          LNAME: contact.lastName || "",
          PHONE: contact.phone || "",
        },
        tags: contact.tags || [],
      };

      const response = await fetch(
        `${this.getBaseUrl()}/lists/${this.listId}/members/${subscriberHash}`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(memberData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.detail || "Failed to upsert member",
        };
      }

      const result = await response.json();
      return {
        success: true,
        id: result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Remove a member from the list
   */
  async removeMember(email: string): Promise<boolean> {
    try {
      const subscriberHash = this.hashEmail(email.toLowerCase());
      const response = await fetch(
        `${this.getBaseUrl()}/lists/${this.listId}/members/${subscriberHash}`,
        {
          method: "DELETE",
          headers: this.getHeaders(),
        }
      );

      return response.ok || response.status === 404; // 404 is acceptable (already deleted)
    } catch (error) {
      console.error("Error removing Mailchimp member:", error);
      return false;
    }
  }

  /**
   * Hash email for subscriber ID (MD5)
   */
  private hashEmail(email: string): string {
    // Simple MD5 implementation for Mailchimp subscriber hash
    const crypto = require("crypto");
    return crypto.createHash("md5").update(email).digest("hex");
  }

  /**
   * Test the connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/lists/${this.listId}`, {
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
 * Demo mode for Mailchimp - returns mock data when no API key is present
 */
export class MailchimpDemoClient extends MailchimpClient {
  constructor() {
    super("demo-key-us1", "demo-list");
  }

  async getLists(): Promise<MailchimpListResponse | null> {
    return {
      lists: [
        {
          id: "demo-list-1",
          name: "Demo Newsletter",
          contact: {
            company: "Demo Charity",
            address1: "123 Demo St",
            city: "Demo City",
            state: "DC",
            zip: "12345",
            country: "US",
            phone: "555-0000",
          },
          stats: {
            member_count: 1250,
          },
        },
      ],
    };
  }

  async getMembers(): Promise<MailchimpMemberResponse | null> {
    return {
      members: [
        {
          id: "demo-member-1",
          email_address: "john.doe@example.com",
          unique_email_id: "demo-1",
          email_type: "html",
          status: "subscribed",
          merge_fields: { FNAME: "John", LNAME: "Doe" },
          timestamp_signup: new Date().toISOString(),
          timestamp_opt: new Date().toISOString(),
          member_rating: 5,
          last_changed: new Date().toISOString(),
        },
      ],
      list_id: "demo-list",
    };
  }

  async upsertMember(contact: MailchimpContact): Promise<{ success: boolean; id?: string; error?: string }> {
    return {
      success: true,
      id: "demo-member-" + Math.random().toString(36).substr(2, 9),
    };
  }

  async removeMember(): Promise<boolean> {
    return true;
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}
