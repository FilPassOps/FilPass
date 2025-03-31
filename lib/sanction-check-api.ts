import axios from 'axios';

interface ChainalysisIdentification {
  category: string;
  name: string;
  description?: string;
  url?: string;
}

interface ChainalysisResponse {
  identifications: ChainalysisIdentification[];
}

export class SanctionCheckAPI {
  private readonly apiKey?: string;
  private readonly baseURL: string = 'https://public.chainalysis.com/api/v1';
  private readonly isEnabled: boolean;

  constructor() {
    this.apiKey = process.env.CHAINALYSIS_API_KEY;
    this.isEnabled = !!this.apiKey;
  }

  private getHeaders() {
    return {
      'X-API-Key': this.apiKey || '',
      'Accept': 'application/json',
    };
  }

  /**
   * Checks if a wallet address is sanctioned using Chainalysis API
   * @param address - The wallet address to check
   * @returns Promise<{ isSanctioned: boolean, details?: ChainalysisIdentification[] }>
   */
  async checkAddress(address: string): Promise<{
    isSanctioned: boolean;
    details?: ChainalysisIdentification[];
  }> {
    if (!this.isEnabled) {
      return { isSanctioned: false };
    }

    try {
      const response = await axios.get<ChainalysisResponse>(
        `${this.baseURL}/address/${address}`,
        {
          headers: this.getHeaders(),
        }
      );

      const identifications = response.data.identifications;

      return {
        isSanctioned: identifications.length > 0,
        details: identifications.length > 0 ? identifications : undefined
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Address not found in sanctions list
        return { isSanctioned: false };
      }
      console.error('Error checking address sanctions:', error);
      throw new Error('Failed to check address sanctions');
    }
  }

  /**
   * Batch check multiple wallet addresses
   * @param addresses - Array of wallet addresses to check
   * @returns Promise<Record<string, { isSanctioned: boolean, details?: ChainalysisIdentification[] }>>
   */
  async checkAddresses(addresses: string[]): Promise<Record<string, {
    isSanctioned: boolean;
    details?: ChainalysisIdentification[];
  }>> {
    if (!this.isEnabled) {
      return Object.fromEntries(addresses.map(address => [address, { isSanctioned: false }]));
    }

    const results: Record<string, {
      isSanctioned: boolean;
      details?: ChainalysisIdentification[];
    }> = {};

    // Chainalysis API doesn't support batch checking, so we need to check each address individually
    await Promise.all(
      addresses.map(async (address) => {
        try {
          results[address] = await this.checkAddress(address);
        } catch (error) {
          console.error(`Error checking address ${address}:`, error);
          results[address] = { isSanctioned: false };
        }
      })
    );

    return results;
  }
}

// Export a singleton instance
export const sanctionCheck = new SanctionCheckAPI();
