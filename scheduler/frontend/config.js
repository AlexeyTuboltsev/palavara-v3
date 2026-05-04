/**
 * Frontend configuration
 * Replace API_BASE_URL with the value from `sam deploy` output (ApiBaseUrl).
 *
 * Example:
 *   const API_BASE_URL = 'https://abc123def.execute-api.eu-central-1.amazonaws.com/Prod';
 */
const API_BASE_URL = 'https://74c5ex58qa.execute-api.eu-central-1.amazonaws.com/Prod';

// Export for use in other scripts (works as a plain <script> tag)
window.SCHEDULER_CONFIG = { API_BASE_URL };
