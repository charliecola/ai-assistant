/**
 * Utility to parse query parameters from the URL hash (#)
 * Example: #/path?param1=value1&param2=value2
 * @returns {URLSearchParams} An object containing the query parameters found in the hash.
 */
export function getHashQueryParams() {
  const hash = window.location.hash;
  const queryStringInHash = hash.split('?')[1]; // Get the part after '?' in the hash

  if (queryStringInHash) {
    return new URLSearchParams(queryStringInHash);
  } else {
    return new URLSearchParams(); // Return empty params if no query string in hash
  }
} 