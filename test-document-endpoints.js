// Test script to verify document endpoints are working correctly
const axios = require('axios');

const BASE_URL = 'http://localhost:9002/api';
const DOCUMENT_ID = '684c136333b3ba2f426e4549';

async function testDocumentEndpoints() {
  try {
    console.log('Testing document endpoints...\n');

    // Test 1: Get document by ID (needs authentication - will fail but should show the endpoint structure)
    console.log('1. Testing GET /documents/:id');
    try {
      const response = await axios.get(`${BASE_URL}/documents/${DOCUMENT_ID}`);
      console.log('✅ Document fetched successfully');
      console.log('Document has s3Url:', !!response.data.s3Url);
      console.log('s3Url:', response.data.s3Url);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('❌ Authentication required (expected)');
        console.log('Error:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 2: Check if document endpoint exists
    console.log('\n2. Testing endpoint availability');
    try {
      const response = await axios.get(`${BASE_URL}/documents`);
      console.log('✅ Documents endpoint exists');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Documents endpoint exists (requires auth)');
      } else {
        console.log('❌ Documents endpoint error:', error.message);
      }
    }

    // Test 3: Test QR endpoint (for sharing)
    console.log('\n3. Testing QR sharing endpoint');
    try {
      const response = await axios.post(`${BASE_URL}/qr`, {
        title: 'Test Share',
        documents: [DOCUMENT_ID],
        isPublic: true
      });
      console.log('✅ QR sharing endpoint works');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ QR sharing endpoint exists (requires auth)');
      } else {
        console.log('❌ QR sharing error:', error.response?.data?.message || error.message);
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDocumentEndpoints();
