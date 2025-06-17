const axios = require('axios');

const BASE_URL = 'http://localhost:9002/api';

async function testQRBundleCreation() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
      email: 'admin@test.com',
      password: 'password123' // You may need to adjust this
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Get all documents to see what we can use
    console.log('\n📄 Getting documents...');
    const documentsResponse = await axios.get(`${BASE_URL}/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Documents found:', documentsResponse.data.documents?.length || 0);
    
    if (documentsResponse.data.documents && documentsResponse.data.documents.length > 0) {
      const firstDoc = documentsResponse.data.documents[0];
      console.log('First document:', firstDoc.originalName, 'ID:', firstDoc._id);

      // Try to create QR bundle with first document
      console.log('\n📦 Creating QR bundle...');
      const qrBundleResponse = await axios.post(`${BASE_URL}/qr`, {
        title: 'Test QR Bundle',
        description: 'Testing QR bundle creation',
        documentIds: [firstDoc._id],
        sharingSettings: {
          isPublic: false,
          requirePasscode: true,
          allowDownload: true
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ QR Bundle created successfully:', qrBundleResponse.data);
    } else {
      console.log('❌ No documents found to create QR bundle with');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.stack) {
      console.error('Stack trace:', error.response.data.stack);
    }
  }
}

testQRBundleCreation();
