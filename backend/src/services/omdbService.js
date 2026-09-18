const env = require('../config/env');
const { ExternalAPIError } = require('../utils/AppError');

const BASE_URL = 'https://www.omdbapi.com/';

async function getByTitle(title, year) {
  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', env.omdbApiKey);
  url.searchParams.set('t', title);
  if (year) url.searchParams.set('y', year);

  const res = await fetch(url);
  if (!res.ok) {
    throw new ExternalAPIError(`OMDb request failed (${res.status}) for title "${title}"`);
  }

  const data = await res.json();
  // OMDb returns 200 with Response:"False" on no-match, not an HTTP error - check both.
  if (data.Response === 'False') {
    throw new ExternalAPIError(`OMDb found no match for "${title}": ${data.Error}`);
  }
  return data;
}

module.exports = { getByTitle };
