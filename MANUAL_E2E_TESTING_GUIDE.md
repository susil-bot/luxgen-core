# 🧪 Manual E2E Testing Guide - Authentication API

## 📋 **Testing Overview**

This guide provides step-by-step manual testing instructions for all authentication endpoints in the LuxGen Backend API.

**Base URL**: `https://luxgen-backend.netlify.app`
**Testing Tool**: cURL, Postman, or any HTTP client

---

## 🔐 **Authentication Endpoints to Test**

| Endpoint | Method | Purpose | Expected Status |
|----------|--------|---------|-----------------|
| `/api/auth/register` | POST | User registration | 201 Created |
| `/api/auth/login` | POST | User login | 200 OK |
| `/api/auth/logout` | POST | User logout | 200 OK |
| `/api/auth/forgot-password` | POST | Password reset request | 200 OK |
| `/api/auth/reset-password` | POST | Password reset | 200 OK |
| `/health` | GET | Health check | 200 OK |
| `/api/health` | GET | API health | 200 OK |

---

## 🚀 **Test 1: Health Check Endpoints**

### **1.1 Basic Health Check**
```bash
curl -X GET https://luxgen-backend.netlify.app/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "LuxGen Backend is running",
  "timestamp": "2025-01-18T15:30:00.000Z"
}
```

### **1.2 API Health Check**
```bash
curl -X GET https://luxgen-backend.netlify.app/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "API is healthy",
  "timestamp": "2025-01-18T15:30:00.000Z"
}
```

**✅ Pass Criteria:**
- Status code: 200
- Response contains "OK" status
- Timestamp is present

---

## 📝 **Test 2: User Registration**

### **2.1 Valid Registration**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "123-456-7890",
    "company": "Acme Corp",
    "role": "user"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1234567890",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "123-456-7890",
      "company": "Acme Corp",
      "role": "user",
      "createdAt": "2025-01-18T15:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Registration successful"
}
```

**✅ Pass Criteria:**
- Status code: 201
- User data returned (without password)
- JWT token present
- Success message

### **2.2 Duplicate Registration (Should Fail)**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

**✅ Pass Criteria:**
- Status code: 400
- Error message about existing user

### **2.3 Invalid Registration (Missing Fields)**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123",
    "firstName": "A"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Please provide a valid email address",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 6 characters long",
      "param": "password",
      "location": "body"
    },
    {
      "msg": "First name must be between 2 and 50 characters",
      "param": "firstName",
      "location": "body"
    }
  ]
}
```

**✅ Pass Criteria:**
- Status code: 400
- Validation errors listed
- Specific field errors

---

## 🔑 **Test 3: User Login**

### **3.1 Valid Login**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1234567890",
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "123-456-7890",
      "company": "Acme Corp",
      "role": "user",
      "createdAt": "2025-01-18T15:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**✅ Pass Criteria:**
- Status code: 200
- User data returned
- JWT token present
- Success message

### **3.2 Invalid Login (Wrong Password)**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**✅ Pass Criteria:**
- Status code: 401
- Error message about invalid credentials

### **3.3 Invalid Login (Non-existent User)**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**✅ Pass Criteria:**
- Status code: 401
- Error message about invalid credentials

---

## 🚪 **Test 4: User Logout**

### **4.1 Valid Logout**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/logout \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**✅ Pass Criteria:**
- Status code: 200
- Success message

---

## 🔒 **Test 5: Password Reset (Forgot Password)**

### **5.1 Forgot Password Request**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

**✅ Pass Criteria:**
- Status code: 200
- Success message

### **5.2 Forgot Password (Non-existent User)**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

**✅ Pass Criteria:**
- Status code: 200
- Success message (for security, don't reveal if user exists)

### **5.3 Reset Password**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-123",
    "newPassword": "newpassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**✅ Pass Criteria:**
- Status code: 200
- Success message

---

## 🧪 **Test 6: Edge Cases and Error Handling**

### **6.1 Invalid JSON**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected Response:**
```json
{
  "error": "Bad Request",
  "message": "Invalid JSON"
}
```

### **6.2 Missing Content-Type Header**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/login \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected Response:**
```json
{
  "error": "Bad Request",
  "message": "Content-Type must be application/json"
}
```

### **6.3 Empty Request Body**
```bash
curl -X POST https://luxgen-backend.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Please provide a valid email address",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password is required",
      "param": "password",
      "location": "body"
    }
  ]
}
```

---

## 📊 **Test Results Checklist**

### **✅ Health Checks**
- [ ] `/health` returns 200 OK
- [ ] `/api/health` returns 200 OK
- [ ] Response contains timestamp
- [ ] Response contains "OK" status

### **✅ Registration**
- [ ] Valid registration returns 201 Created
- [ ] User data returned without password
- [ ] JWT token generated
- [ ] Duplicate registration returns 400
- [ ] Invalid data returns validation errors

### **✅ Login**
- [ ] Valid login returns 200 OK
- [ ] User data returned
- [ ] JWT token generated
- [ ] Invalid credentials return 401
- [ ] Non-existent user returns 401

### **✅ Logout**
- [ ] Logout returns 200 OK
- [ ] Success message returned

### **✅ Password Reset**
- [ ] Forgot password returns 200 OK
- [ ] Reset password returns 200 OK
- [ ] Success messages returned

### **✅ Error Handling**
- [ ] Invalid JSON returns 400
- [ ] Missing headers return 400
- [ ] Empty requests return validation errors
- [ ] Proper error messages

---

## 🚀 **Quick Test Script**

Save this as `test-api.sh` and run: `chmod +x test-api.sh && ./test-api.sh`

```bash
#!/bin/bash

echo "🧪 LuxGen API E2E Testing"
echo "========================="

BASE_URL="https://luxgen-backend.netlify.app"

echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | jq '.'

echo -e "\n2. Testing API Health..."
curl -s "$BASE_URL/api/health" | jq '.'

echo -e "\n3. Testing User Registration..."
curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe"}' | jq '.'

echo -e "\n4. Testing User Login..."
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq '.'

echo -e "\n5. Testing User Logout..."
curl -s -X POST "$BASE_URL/api/auth/logout" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n✅ Testing Complete!"
```

---

## 📝 **Test Report Template**

```
# LuxGen API E2E Test Report

**Date**: [Current Date]
**Tester**: [Your Name]
**Environment**: Production (Netlify)
**Base URL**: https://luxgen-backend.netlify.app

## Test Results Summary
- Total Tests: 15
- Passed: [X]
- Failed: [X]
- Success Rate: [X]%

## Detailed Results
[Copy and paste test results here]

## Issues Found
[List any issues or bugs found]

## Recommendations
[Any recommendations for improvements]
```

---

## 🎯 **Success Criteria**

The API is working correctly if:
- ✅ All health checks return 200 OK
- ✅ User registration works with valid data
- ✅ User login works with correct credentials
- ✅ User logout works
- ✅ Password reset endpoints respond
- ✅ Error handling works for invalid data
- ✅ Validation works for required fields
- ✅ JWT tokens are generated and returned

**🚀 Ready for Production!** 🎉
