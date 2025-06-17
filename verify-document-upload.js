/**
 * Test script for verifying internal request document uploads
 * 
 * This script tests that documents uploaded when accepting an internal request
 * are properly created in the database and should appear in the documents page.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:9002/api';
let token = null;

// Helper function for API calls
const api = axios.create({
  baseURL: API_URL,
});

// Set auth token for subsequent requests
const setAuthToken = (newToken) => {
  token = newToken;
  api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
};

// Run the test
async function runTest() {
  try {
    console.log('1. Logging in to obtain auth token...');
    // Use test user credentials (replace with your test user)
    const loginResponse = await api.post('/users/login', {
      email: 'test@example.com', // Replace with your test user
      password: 'password123'    // Replace with your test password
    });
    
    setAuthToken(loginResponse.data.token);
    const userId = loginResponse.data.user._id;
    console.log(`Logged in successfully as user ${userId}`);
    
    // 2. Create a test internal request
    console.log('\n2. Creating a test internal request...');
    const internalRequestData = {
      requestTitle: `Test Request ${Date.now()}`,
      requestDescription: 'This is a test request for document upload verification',
      recipients: [userId], // Send to self for testing
      priority: 'medium',
      category: 'document_sharing',
      tags: ['test']
    };
    
    const createRequestResponse = await api.post('/internal-requests', internalRequestData);
    const requestId = createRequestResponse.data.request._id;
    console.log(`Internal request created with ID: ${requestId}`);
    
    // 3. Upload document as response to the request
    console.log('\n3. Responding to request with document upload...');
    
    // Create a temporary test file
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, `Test content ${Date.now()}`);
    
    // Create multipart form data
    const formData = new FormData();
    formData.append('status', 'accepted');
    formData.append('responseMessage', 'Testing document upload');
    formData.append('documents', fs.createReadStream(testFilePath), 'test-document.txt');
    
    const responseResult = await api.post(
      `/internal-requests/${requestId}/respond`, 
      formData, 
      { headers: { ...formData.getHeaders() } }
    );
    
    console.log('Response sent successfully');
    
    // 4. Verify document creation
    console.log('\n4. Verifying document was created...');
    const userResponse = responseResult.data.request.responses.find(
      r => r.recipient._id === userId
    );
    
    if (!userResponse || !userResponse.documents || userResponse.documents.length === 0) {
      console.error('TEST FAILED: No documents found in response');
      return;
    }
    
    const docInfo = userResponse.documents[0];
    console.log(`Document found in response: ${docInfo.fileName} (${docInfo.fileSize} bytes)`);
    
    if (!docInfo.documentId) {
      console.error('TEST FAILED: Document ID not found in response');
      return;
    }
    
    console.log(`Document ID: ${docInfo.documentId}`);
    
    // 5. Verify document appears in documents list
    console.log('\n5. Verifying document appears in documents list...');
    const documentsResponse = await api.get('/documents/me');
    
    const documentFound = documentsResponse.data.documents.some(
      doc => doc._id === docInfo.documentId
    );
    
    if (documentFound) {
      console.log('SUCCESS: Document found in documents list!');
    } else {
      console.log('ERROR: Document not found in documents list');
      
      // Fetch document directly by ID to check it exists
      try {
        const documentResponse = await api.get(`/documents/${docInfo.documentId}`);
        console.log('Document exists in database but is not showing in list');
        console.log('Document details:', {
          name: documentResponse.data.originalName,
          uploadedBy: documentResponse.data.uploadedBy,
          type: documentResponse.data.fileType
        });
      } catch (error) {
        console.log('Document does not exist in database by ID');
      }
    }
    
    // 6. Clean up test file
    fs.unlinkSync(testFilePath);
    console.log('\nTest completed.');
    
  } catch (error) {
    console.error('Test error:', error.response?.data || error.message);
  }
}

runTest();
