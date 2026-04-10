// API URL configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Returns a fully qualified API URL with the /api/ path prefix
 * @param {string} endpoint - The API endpoint path without leading slash
 * @returns {string} The complete API URL
 */
export const getApiUrl = (endpoint) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
    return `${API_BASE_URL}/api/${cleanEndpoint}`
}

/**
 * Makes a fetch request to the API
 * @param {string} endpoint - The API endpoint path without leading slash
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export const fetchApi = async (endpoint, options = {}) => {
    const url = getApiUrl(endpoint)
    return fetch(url, options)
}

export default {
    getApiUrl,
    fetchApi,
}
