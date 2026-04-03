/**
 * Loqate Address Verification Integration
 *
 * Provides address lookup and verification via Loqate API.
 * Falls back to mock UK addresses if API key is not configured.
 */

export interface AddressResult {
  id: string;
  text: string;
  description: string;
  postcode?: string;
}

export interface AddressDetails extends AddressResult {
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  county?: string;
  postcode: string;
  country?: string;
}

const MOCK_ADDRESSES: Record<string, AddressDetails[]> = {
  // Mock search results for common UK postcodes
  "sw1a": [
    {
      id: "gb|RM05092225938",
      text: "10 Downing Street, London SW1A 2AA",
      description: "10 Downing Street, London SW1A 2AA",
      line1: "10 Downing Street",
      city: "London",
      postcode: "SW1A 2AA",
      country: "United Kingdom",
    },
    {
      id: "gb|RM05092227891",
      text: "1 Horse Guards Road, London SW1A 2HQ",
      description: "1 Horse Guards Road, London SW1A 2HQ",
      line1: "1 Horse Guards Road",
      city: "London",
      postcode: "SW1A 2HQ",
      country: "United Kingdom",
    },
  ],
  "ec1a": [
    {
      id: "gb|RM05092228451",
      text: "Unit 1, Clerkenwell Road, London EC1A 1HX",
      description: "Unit 1, Clerkenwell Road, London EC1A 1HX",
      line1: "Unit 1, Clerkenwell Road",
      city: "London",
      postcode: "EC1A 1HX",
      country: "United Kingdom",
    },
  ],
  "m1a": [
    {
      id: "gb|RM05092228987",
      text: "10 Lever Street, Manchester M1A 1DY",
      description: "10 Lever Street, Manchester M1A 1DY",
      line1: "10 Lever Street",
      city: "Manchester",
      postcode: "M1A 1DY",
      country: "United Kingdom",
    },
  ],
};

/**
 * Search for addresses matching a query string
 * Returns mock results if no API key is configured
 *
 * @param query - Search query (e.g. "10 Downing")
 * @returns Array of address suggestions
 */
export async function searchAddress(query: string): Promise<AddressResult[]> {
  const apiKey = process.env.LOQATE_API_KEY;

  if (!apiKey) {
    return searchMockAddresses(query);
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.loqate.com/Autocomplete/Find/v1.00/json3?Key=${apiKey}&Text=${encodedQuery}&Countries=GB`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn("Loqate API request failed, falling back to mock data");
      return searchMockAddresses(query);
    }

    const data = await response.json() as {
      Items?: Array<{
        Id: string;
        Text: string;
        Description: string;
      }>;
    };

    if (!Array.isArray(data.Items)) {
      return [];
    }

    return data.Items.map((item) => ({
      id: item.Id,
      text: item.Text,
      description: item.Description,
    }));
  } catch (error) {
    console.error("Error calling Loqate API:", error);
    return searchMockAddresses(query);
  }
}

/**
 * Get full details for a specific address
 * Returns mock details if no API key is configured
 *
 * @param id - Address ID from search results
 * @returns Full address details
 */
export async function getAddressDetails(id: string): Promise<AddressDetails | null> {
  const apiKey = process.env.LOQATE_API_KEY;

  if (!apiKey) {
    return getMockAddressDetails(id);
  }

  try {
    const url = `https://api.loqate.com/Autocomplete/GetResult/v1.00/json3?Key=${apiKey}&Id=${encodeURIComponent(id)}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn("Loqate Details API request failed, falling back to mock data");
      return getMockAddressDetails(id);
    }

    const data = await response.json() as {
      Id?: string;
      Text?: string;
      Description?: string;
      Address1?: string;
      Address2?: string;
      Address3?: string;
      City?: string;
      County?: string;
      PostalCode?: string;
      CountryName?: string;
    };

    if (!data.Id) {
      return null;
    }

    return {
      id: data.Id,
      text: data.Text ?? "",
      description: data.Description ?? "",
      line1: data.Address1 ?? "",
      line2: data.Address2,
      line3: data.Address3,
      city: data.City ?? "",
      county: data.County,
      postcode: data.PostalCode ?? "",
      country: data.CountryName,
    };
  } catch (error) {
    console.error("Error calling Loqate Details API:", error);
    return getMockAddressDetails(id);
  }
}

/**
 * Search mock addresses (for demo/testing without API key)
 */
function searchMockAddresses(query: string): AddressResult[] {
  const lowerQuery = query.toLowerCase();
  const results: AddressResult[] = [];

  for (const [key, addresses] of Object.entries(MOCK_ADDRESSES)) {
    if (key.includes(lowerQuery)) {
      results.push(
        ...addresses.map((addr) => ({
          id: addr.id,
          text: addr.text,
          description: addr.description,
        }))
      );
    } else {
      // Also search within address text
      for (const addr of addresses) {
        if (
          addr.text.toLowerCase().includes(lowerQuery) ||
          addr.city.toLowerCase().includes(lowerQuery)
        ) {
          results.push({
            id: addr.id,
            text: addr.text,
            description: addr.description,
          });
        }
      }
    }
  }

  return results.slice(0, 10); // Return max 10 results
}

/**
 * Get mock address details by ID
 */
function getMockAddressDetails(id: string): AddressDetails | null {
  for (const addresses of Object.values(MOCK_ADDRESSES)) {
    const found = addresses.find((addr) => addr.id === id);
    if (found) {
      return found;
    }
  }
  return null;
}
