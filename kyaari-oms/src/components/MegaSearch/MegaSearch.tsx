import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Clock, Package, Users, FileText, Wallet, MapPin, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { globalSearchService, type SearchResult } from '../../services/globalSearchService'

interface MegaSearchProps {
  isMobile: boolean
  userRole: 'ADMIN' | 'OPS' | 'ACCOUNTS' | 'VENDOR'
  placeholder?: string
}


function MegaSearch({ isMobile, userRole, placeholder = "Mega Search" }: MegaSearchProps) {
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableEntityTypes, setAvailableEntityTypes] = useState<string[]>([])
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<number | null>(null)

  // Fetch available entity types on component mount
  useEffect(() => {
    const fetchEntityTypes = async () => {
        try {
          console.log('Fetching entity types for role:', userRole)
          const response = await globalSearchService.getAvailableEntityTypes()
          console.log('Entity types response:', response)
          console.log('Entity types data structure:', response.data)
          
          // Handle nested response structure for entity types
          let entityTypes: string[] = []
          const responseData = response.data as any // Type assertion to handle nested structure
          
          if (responseData) {
            // Check if it's the expected structure
            if (responseData.entityTypes) {
              entityTypes = responseData.entityTypes
            } 
            // Check if it's nested structure
            else if (responseData.data && responseData.data.entityTypes) {
              entityTypes = responseData.data.entityTypes
            } else {
              throw new Error('Invalid entity types response structure')
            }
          } else {
            throw new Error('No data in entity types response')
          }
          
          setAvailableEntityTypes(entityTypes)
        } catch (err) {
          console.error('Failed to fetch entity types:', err)
          // Fallback to default entity types based on role
          const defaultTypes = {
            'ADMIN': ['orders', 'users', 'vendors', 'tickets', 'payments', 'dispatches', 'grns'],
            'OPS': ['orders', 'vendors', 'tickets', 'dispatches', 'grns'],
            'ACCOUNTS': ['orders', 'vendors', 'payments', 'tickets'],
            'VENDOR': ['orders', 'tickets']
          }
          const fallbackTypes = defaultTypes[userRole] || []
          console.log('Using fallback entity types:', fallbackTypes)
          setAvailableEntityTypes(fallbackTypes)
        }
    }

    fetchEntityTypes()
  }, [userRole])

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showResults])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Handle search submission
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) return
    
    // For now, just trigger the search without navigation
    // TODO: Create dedicated search results pages for each role
    handleSearchChange(search.trim())
  }

  // Handle input change with debounced search
  function handleSearchChange(value: string) {
    setSearch(value)
    setError(null)
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (value.trim().length >= 2) {
      setIsLoading(true)
      
      // Debounce the search API call
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Searching for:', value.trim())
          console.log('Available entity types:', availableEntityTypes)
          
          const response = await globalSearchService.searchByQuery(
            value.trim(),
            availableEntityTypes,
            1,
            10 // Limit to 10 results for dropdown
          )
          
          console.log('Search response:', response)
          console.log('Response data structure:', response.data)
          
          // Handle the nested response structure
          let results: SearchResult[] = []
          const responseData = response.data as any // Type assertion to handle nested structure
          
          if (responseData) {
            // Check if it's the expected structure
            if (responseData.results) {
              results = responseData.results
            } 
            // Check if it's nested structure
            else if (responseData.data && responseData.data.results) {
              results = responseData.data.results
            } else {
              console.error('Unexpected response structure:', response)
              setError('Unexpected response format from server')
              setResults([])
              setShowResults(true)
              return
            }
          } else {
            console.error('No data in search response:', response)
            setError('No data received from server')
            setResults([])
            setShowResults(true)
            return
          }
          
          setResults(results)
          setShowResults(true)
          setError(null)
        } catch (err) {
          console.error('Search failed:', err)
          const errorMessage = err instanceof Error ? err.message : 'Search failed'
          console.error('Error details:', errorMessage)
          
          // If API is not available, show a helpful message
          if (errorMessage.includes('HTML instead of JSON') || errorMessage.includes('Failed to fetch')) {
            setError('Global search API is not available. Please ensure the backend server is running.')
          } else {
            setError(errorMessage)
          }
          
          setResults([])
          setShowResults(true)
        } finally {
          setIsLoading(false)
        }
      }, 300)
    } else {
      setShowResults(false)
      setResults([])
      setIsLoading(false)
    }
  }


  // Get icon for entity type
  function getEntityIcon(type: string): LucideIcon {
    switch (type) {
      case 'orders': return Package
      case 'users': return Users
      case 'vendors': return Users
      case 'tickets': return AlertTriangle
      case 'payments': return Wallet
      case 'dispatches': return MapPin
      case 'grns': return FileText
      default: return Search
    }
  }

  // Get color for entity type
  function getEntityColor(type: string): string {
    switch (type) {
      case 'orders': return 'bg-green-100 text-green-600'
      case 'users': return 'bg-blue-100 text-blue-600'
      case 'vendors': return 'bg-purple-100 text-purple-600'
      case 'tickets': return 'bg-orange-100 text-orange-600'
      case 'payments': return 'bg-yellow-100 text-yellow-600'
      case 'dispatches': return 'bg-indigo-100 text-indigo-600'
      case 'grns': return 'bg-pink-100 text-pink-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  // Handle result click
  function handleResultClick(result: SearchResult) {
    // Navigate to appropriate detail page based on entity type and user role
    const getDetailPath = (entityType: string, entityId: string, role: string): string => {
      const basePaths: Record<string, Record<string, string>> = {
        'ADMIN': {
          'orders': '/admin/orders',
          'users': '/admin/users',
          'vendors': '/admin/vendors',
          'tickets': '/admin/tickets',
          'payments': '/admin/payments',
          'dispatches': '/admin/dispatches',
          'grns': '/admin/grns'
        },
        'OPS': {
          'orders': '/operations/received-orders',
          'vendors': '/operations/vendors',
          'tickets': '/operations/tickets',
          'dispatches': '/operations/dispatches',
          'grns': '/operations/grns'
        },
        'ACCOUNTS': {
          'orders': '/accounts/vendor-orders',
          'vendors': '/accounts/vendors',
          'payments': '/accounts/payment-release',
          'tickets': '/accounts/support'
        },
        'VENDOR': {
          'orders': '/vendors/orders',
          'tickets': '/vendors/support'
        }
      }
      
      const rolePaths = basePaths[role] || basePaths['ADMIN']
      const basePath = rolePaths[entityType] || `/${role.toLowerCase()}`
      return `${basePath}/${entityId}`
    }
    
    const detailPath = getDetailPath(result.type, result.id, userRole)
    navigate(detailPath)
    setShowResults(false)
  }

  return (
    <div ref={searchRef} className={`relative ${isMobile ? 'flex-1 mx-3' : 'w-80'}`}>
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
        <div className={`relative ${isMobile ? 'w-full' : 'w-full'}`}>
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-secondary)' }}>
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={isMobile ? "Search..." : placeholder}
            className={`pl-11 pr-3 h-9 rounded-md bg-white text-[var(--color-secondary)] placeholder-[var(--color-secondary)] outline-none transition-all ${
              isMobile ? 'w-full' : 'w-full'
            }`}
          />
          
          {/* Search Results Dropdown */}
          {showResults && (
            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg border border-gray-200 z-50 ${
              isMobile ? 'max-w-full' : 'w-96'
            } max-h-[400px] overflow-y-auto`} style={{ background: 'white' }}>
              {/* Results Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Search Results</h3>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Results List */}
              <div className="max-h-[300px] overflow-y-auto">
                {isLoading ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
                    <p className="mt-2">Searching...</p>
                  </div>
                ) : error ? (
                  <div className="px-4 py-8 text-center text-red-500">
                    <X size={24} className="mx-auto mb-2 text-red-300" />
                    <p>Search failed</p>
                    <p className="text-sm text-red-400 mt-1">{error}</p>
                    <button
                      onClick={() => handleSearchChange(search)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Try again
                    </button>
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Search size={24} className="mx-auto mb-2 text-gray-300" />
                    <p>No results found</p>
                    <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  results.map((result) => {
                    const IconComponent = getEntityIcon(result.type)
                    return (
                      <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full flex-shrink-0 ${getEntityColor(result.type)}`}>
                            <IconComponent size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {result.title}
                              </h4>
                              <span className="text-xs text-gray-400 capitalize">
                                {result.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                            {result.relevanceScore && (
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock size={12} />
                                  {result.relevanceScore}% match
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Results Footer */}
              {results.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200">
                  <div className="text-sm text-gray-500 text-center">
                    Showing {results.length} results for "{search}"
                    {/* TODO: Add "View all results" functionality when search results page is created */}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}

export default MegaSearch
