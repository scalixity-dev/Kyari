import axios from 'axios'

interface PostOffice {
  Name: string
  Description: string | null
  BranchType: string
  DeliveryStatus: string
  Circle: string
  District: string
  Division: string
  Region: string
  Block: string
  State: string
  Country: string
  Pincode: string
}

interface PincodeApiResponse {
  Message: string
  Status: string
  PostOffice: PostOffice[] | null
}

export interface PincodeDetails {
  pincode: string
  district: string
  state: string
  city: string
  area: string
  country: string
}

class PincodeApiService {
  private readonly BASE_URL = 'https://api.postalpincode.in'

  /**
   * Fetch location details by pincode
   * API: https://api.postalpincode.in/pincode/{pincode}
   */
  async getPincodeDetails(pincode: string): Promise<PincodeDetails | null> {
    try {
      // Validate pincode format (6 digits)
      if (!/^\d{6}$/.test(pincode)) {
        return null
      }

      const response = await axios.get<PincodeApiResponse[]>(`${this.BASE_URL}/pincode/${pincode}`)
      
      const data = response.data[0]
      
      if (data.Status !== 'Success' || !data.PostOffice || data.PostOffice.length === 0) {
        return null
      }

      // Get the first post office data (usually the main one)
      const postOffice = data.PostOffice[0]

      return {
        pincode: postOffice.Pincode,
        district: postOffice.District,
        state: postOffice.State,
        city: postOffice.Block || postOffice.District, // Block is usually the city/taluka
        area: postOffice.Name, // Post office name is usually the area
        country: postOffice.Country
      }
    } catch (error) {
      console.error('Error fetching pincode details:', error)
      return null
    }
  }

  /**
   * Search post offices by location name
   * API: https://api.postalpincode.in/postoffice/{location}
   */
  async searchByLocation(location: string): Promise<PincodeDetails[]> {
    try {
      if (!location || location.trim().length < 3) {
        return []
      }

      const response = await axios.get<PincodeApiResponse[]>(
        `${this.BASE_URL}/postoffice/${encodeURIComponent(location)}`
      )
      
      const data = response.data[0]
      
      if (data.Status !== 'Success' || !data.PostOffice || data.PostOffice.length === 0) {
        return []
      }

      return data.PostOffice.map(po => ({
        pincode: po.Pincode,
        district: po.District,
        state: po.State,
        city: po.Block || po.District,
        area: po.Name,
        country: po.Country
      }))
    } catch (error) {
      console.error('Error searching by location:', error)
      return []
    }
  }
}

export const pincodeApi = new PincodeApiService()

