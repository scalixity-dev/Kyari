// Token getter function
const getAccessToken = (): string | null => {
  try {
    return localStorage.getItem('kyaari_access_token')
  } catch {
    return null
  }
}

export interface SearchResult {
  type: string
  id: string
  title: string
  description: string
  metadata: Record<string, unknown>
  relevanceScore?: number
}

export interface GlobalSearchRequest {
  query: string
  entityTypes?: string[]
  page?: number
  limit?: number
}

export interface GlobalSearchResponse {
  success: boolean
  data: {
    results: SearchResult[]
    total: number
    page: number
    limit: number
    entityTypes: string[]
  }
  message?: string
}

export interface AvailableEntityTypesResponse {
  success: boolean
  data: {
    entityTypes: string[]
  }
  message?: string
}

class GlobalSearchService {
  private baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/global-search`

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getAccessToken()  
    
    if (!token) {
      throw new Error('No access token available. Please login again.')
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (jsonError) {
        // If response is not JSON (e.g., HTML error page), try to get text
        try {
          const errorText = await response.text()
          if (errorText.includes('<!doctype') || errorText.includes('<html')) {
            errorMessage = 'Server returned HTML instead of JSON. Please check if the API endpoint is correct.'
          } else {
            errorMessage = errorText || errorMessage
          }
        } catch (textError) {
          // Use the default error message
        }
      }
      
      throw new Error(errorMessage)
    }

    try {
      const data = await response.json()
      return data
    } catch (jsonError) {
      throw new Error('Invalid JSON response from server')
    }
  }

  /**
   * Perform global search using POST method
   */
  async search(request: GlobalSearchRequest): Promise<GlobalSearchResponse> {
    return this.makeRequest<GlobalSearchResponse>('/search', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  /**
   * Perform global search using GET method with query parameters
   */
  async searchByQuery(
    query: string,
    entityTypes?: string[],
    page?: number,
    limit?: number
  ): Promise<GlobalSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      ...(page && { page: page.toString() }),
      ...(limit && { limit: limit.toString() }),
    })

    // Add entity types as individual parameters (backend expects multiple 'types' parameters)
    if (entityTypes && entityTypes.length > 0) {
      entityTypes.forEach(type => {
        params.append('types', type)
      })
    }

    const url = `/search?${params}`
    console.log('Search URL:', url)
    console.log('Entity types being sent:', entityTypes)

    return this.makeRequest<GlobalSearchResponse>(url)
  }

  /**
   * Get available entity types for the current user's role
   */
  async getAvailableEntityTypes(): Promise<AvailableEntityTypesResponse> {
    return this.makeRequest<AvailableEntityTypesResponse>('/entity-types')
  }

  /**
   * Health check for the global search service
   */
  async healthCheck(): Promise<{ success: boolean; data: { status: string } }> {
    return this.makeRequest('/health')
  }
}

export const globalSearchService = new GlobalSearchService()
