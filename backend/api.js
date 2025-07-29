const API_BASE_URL = 'http://localhost:5073'; // Backend server port

// Takes in an API string (endpoint)
export async function postData(endpoint, data) {
  // Check if the data is a FormData as different handling is needed
  const isFormData = data instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  });

  const resJson = await response.json();

  if (!response.ok) {
    throw new Error(resJson.message || `HTTP error! status: ${response.status}`);
  }

  return resJson;
}