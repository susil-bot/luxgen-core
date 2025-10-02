# Frontend API Connection Guide ## API Server Information ### Server Details
- **IP Address**: `192.168.1.9`
- **Port**: `3001`
- **Base URL**: `http://192.168.1.9:3001`
- **API Version**: `v1`
- **Full API Base**: `http://192.168.1.9:3001/api/v1` ### Health Check
- **Health Endpoint**: `http://192.168.1.9:3001/health`
- **API Documentation**: `http://192.168.1.9:3001/docs` ## 🔗 User Registration API ### Endpoint
```
POST http://192.168.1.9:3001/api/v1/registration/register
``` ### Request Headers
```javascript
{ 'Content-Type': 'application/json', 'Accept': 'application/json'}
``` ### Request Body
```javascript
{ email: "user@example.com", password: "password123", firstName: "John", lastName: "Doe", phone: "+1234567890", company: "Company Name", role: "user", marketingConsent: true
}
``` ### Required Fields
- `email` (string) - Valid email format
- `password` (string) - Minimum 6 characters
- `firstName` (string)
- `lastName` (string) ### Optional Fields
- `phone` (string)
- `company` (string)
- `role` (string) - Defaults to "user"- `marketingConsent` (boolean) - Defaults to false ### Response Format
```javascript
{ success: true, message: "User registered successfully", data: { user: { id: "user_id", email: "user@example.com", firstName: "John", lastName: "Doe", role: "user", isActive: true }, token: "jwt_token_here"}
}
``` ## Frontend Implementation ### Using Axios
```javascript
import axios from 'axios'; const API_BASE = 'http://192.168.1.9:3001/api/v1'; const apiClient = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'}
}); // User Registration
const registerUser = async (formData) => { try { const response = await apiClient.post('/registration/register', { email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone, company: formData.company, role: formData.role, marketingConsent: formData.marketingConsent, }); if (response.data.success) { // Store token localStorage.setItem('token', response.data.data.token); localStorage.setItem('user', JSON.stringify(response.data.data.user)); return response.data; } } catch (error) { console.error('Registration error:', error.response?.data || error.message); throw error; }
};
``` ### Using Fetch
```javascript
const API_BASE = 'http://192.168.1.9:3001/api/v1'; const registerUser = async (formData) => { try { const response = await fetch(`${API_BASE}/registration/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json'}, body: JSON.stringify({ email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone, company: formData.company, role: formData.role, marketingConsent: formData.marketingConsent, }) }); const data = await response.json(); if (data.success) { // Store token localStorage.setItem('token', data.data.token); localStorage.setItem('user', JSON.stringify(data.data.user)); return data; } else { throw new Error(data.message); } } catch (error) { console.error('Registration error:', error); throw error; }
};
``` ## Authentication ### JWT Token Usage
After successful registration, you'll receive a JWT token. Use it for authenticated requests: ```javascript
// Add token to requests
const authenticatedRequest = async (endpoint, data) => { const token = localStorage.getItem('token'); const response = await apiClient.post(endpoint, data, { headers: { 'Authorization': `Bearer ${token}` } }); return response.data;
};
``` ### Token Storage
```javascript
// Store token after registration
localStorage.setItem('token', response.data.data.token); // Use token for requests
const token = localStorage.getItem('token'); // Remove token on logout
localStorage.removeItem('token');
``` ## Testing the Connection ### Test Script
You can test the API connection using this script: ```javascript
// Test the health endpoint
fetch('http://192.168.1.9:3001/health') .then(response => response.json()) .then(data => console.log('Health check:', data)) .catch(error => console.error('Connection failed:', error)); // Test user registration
const testRegistration = async () => { try { const response = await fetch('http://192.168.1.9:3001/api/v1/registration/register', { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify({ email: 'test@example.com', password: 'test123', firstName: 'Test', lastName: 'User', phone: '+1234567890', company: 'Test Company', role: 'user', marketingConsent: true }) }); const data = await response.json(); console.log('Registration result:', data); } catch (error) { console.error('Test failed:', error); }
};
``` ## 🚨 Error Handling ### Common Error Responses
```javascript
// 400 - Bad Request
{ success: false, message: "Missing required fields: email, password, firstName, lastName"} // 400 - Validation Error
{ success: false, message: "Invalid email format"} // 400 - User Exists
{ success: false, message: "User with this email already exists"} // 500 - Server Error
{ success: false, message: "Registration failed", error: "Error details"}
``` ### Error Handling Example
```javascript
const handleRegistration = async (formData) => { try { const result = await registerUser(formData); console.log('Registration successful:', result); // Redirect to dashboard or show success message } catch (error) { if (error.response?.data) { const errorMessage = error.response.data.message; console.error('Registration failed:', errorMessage); // Show error message to user } else { console.error('Network error:', error.message); // Show network error message } }
};
``` ## CORS Configuration The API server is configured to accept requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://192.168.1.9:3000`
- `http://192.168.1.9:3001`
- `http://192.168.1.9:8080`
- `http://192.168.1.9:5173`
- `http://192.168.1.9:4173` If you're running on a different port, contact the backend developer to add it to the CORS configuration. ## 📋 Available Endpoints ### Public Endpoints (No Authentication)
- `POST /registration/register` - User registration
- `GET /health` - Health check
- `GET /docs` - API documentation ### Protected Endpoints (Require JWT Token)
- `GET /users` - List users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user ### Tenant Management
- `POST /tenants/create` - Create tenant
- `GET /tenants` - List tenants
- `GET /tenants/:id` - Get tenant by ID
- `PUT /tenants/:id` - Update tenant
- `DELETE /tenants/:id` - Delete tenant ## Quick Start 1. **Test Connection**: ```bash curl http://192.168.1.9:3001/health ``` 2. **Test Registration**: ```bash curl -X POST http://192.168.1.9:3001/api/v1/registration/register \ -H "Content-Type: application/json"\ -d '{ "email": "test@example.com", "password": "test123", "firstName": "Test", "lastName": "User", "phone": "+1234567890", "company": "Test Company", "role": "user", "marketingConsent": true }'``` 3. **Implement in Frontend**: ```javascript const response = await apiClient.post('/registration/register', formData); ``` ## 📞 Support If you encounter any issues:
1. Check if the server is running: `http://192.168.1.9:3001/health`
2. Verify your network connection to `192.168.1.9`
3. Check the browser console for CORS errors
4. Contact the backend developer with error details --- **Last Updated**: July 26, 2025
**API Version**: v1
**Status**: Ready for Production 