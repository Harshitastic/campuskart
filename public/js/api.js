/* ==========================================================================
   CampusKart API Client Wrapper (Fetch API)
   ========================================================================== */

const BASE_URL = '/api';

/**
 * Handle API responses and throw detailed errors
 * @param {Response} response Fetch Response object
 */
const handleResponse = async (response) => {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = (data && data.message) || response.statusText || 'An error occurred';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Common request configuration helper
 */
const request = async (method, path, body = null, isMultipart = false) => {
  const options = {
    method,
    headers: {},
    credentials: 'include' // Crucial for sending/receiving JWT HTTP-only cookies
  };

  if (body) {
    if (isMultipart) {
      options.body = body;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  // Support authorization header fallback if token is in localStorage
  const token = localStorage.getItem('token');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  return handleResponse(response);
};

export const API = {
  get: (path) => request('GET', path),
  
  post: (path, body) => request('POST', path, body),
  
  put: (path, body) => request('PUT', path, body),
  
  delete: (path) => request('DELETE', path),

  /**
   * Upload a single image file
   * @param {File} file File object from input
   * @returns {Promise<Object>} Upload response with image URL
   */
  uploadSingle: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('POST', '/upload/single', formData, true);
  },

  /**
   * Upload multiple image files
   * @param {FileList|Array} files Array of File objects
   * @returns {Promise<Object>} Upload response with array of image URLs
   */
  uploadMultiple: async (files) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    return request('POST', '/upload/multiple', formData, true);
  }
};
