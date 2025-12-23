/**
 * API Service for AutoGD&T Engine
 * Handles communication with FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Upload file and convert to 2D format
 * @param {File} file - The 3D CAD file to upload
 * @param {string} mode - Conversion mode ('3d-to-2d' or '2d-to-3d')
 * @param {string} view - View angle ('top', 'front', 'side', 'isometric')
 * @param {string} outputFormat - Output format ('svg', 'png', 'dxf')
 * @param {string} renderMode - Render mode ('filled', 'wireframe', 'outline')
 * @returns {Promise<{url: string, format: string, fileName: string}>}
 */
export const convertFile = async (file, mode, view = 'top', outputFormat = 'svg', renderMode = 'filled') => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Build query parameters
    const params = new URLSearchParams({
      output_format: outputFormat,
      view: view,
      size: '1000',
      mode: renderMode
    });

    const response = await fetch(`${API_BASE_URL}/convert?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Conversion failed');
    }

    // Get the file blob
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = `output.${outputFormat}`;
    if (contentDisposition) {
      const matches = /filename="(.+)"/.exec(contentDisposition);
      if (matches && matches[1]) {
        fileName = matches[1];
      }
    }

    return {
      url,
      format: outputFormat,
      fileName,
      blob
    };
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Batch convert file to multiple formats and views
 * @param {File} file - The 3D CAD file
 * @param {string[]} outputFormats - Array of output formats
 * @param {string[]} views - Array of views
 * @param {string} renderMode - Render mode
 * @returns {Promise<{url: string, fileName: string}>}
 */
export const batchConvert = async (file, outputFormats = ['svg'], views = ['top', 'front', 'side'], renderMode = 'filled') => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({
      size: '1000',
      mode: renderMode
    });

    // Add multiple formats and views
    outputFormats.forEach(fmt => params.append('output_formats', fmt));
    views.forEach(view => params.append('views', view));

    const response = await fetch(`${API_BASE_URL}/convert/batch?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Batch conversion failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    return {
      url,
      fileName: 'batch_output.zip',
      blob
    };
  } catch (error) {
    console.error('Batch API Error:', error);
    throw error;
  }
};

/**
 * Check API health status
 * @returns {Promise<object>}
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

/**
 * Get API information
 * @returns {Promise<object>}
 */
export const getApiInfo = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get API info:', error);
    throw error;
  }
};
