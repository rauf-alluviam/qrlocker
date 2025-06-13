#!/usr/bin/env node

/**
 * Test script to verify all download endpoints are working correctly
 */

const axios = require('axios');

const API_BASE = 'http://localhost:9002/api';

async function testDownloadEndpoints() {
  console.log('🔍 Testing QRLocker Download Endpoints...\n');

  try {
    // First, let's check if the server is running
    console.log('1. Checking server status...');
    const healthCheck = await axios.get(`${API_BASE.replace('/api', '')}/`).catch(() => null);
    if (!healthCheck) {
      console.log('❌ Server is not running on http://localhost:9002');
      return;
    }
    console.log('✅ Server is running');

    // Test 1: Get a list of documents to test with
    console.log('\n2. Fetching sample documents...');
    try {
      const docsResponse = await axios.get(`${API_BASE}/documents`);
      const documents = docsResponse.data.documents || [];
      
      if (documents.length === 0) {
        console.log('❌ No documents found in the system');
        return;
      }
      
      console.log(`✅ Found ${documents.length} documents`);
      
      // Test regular download endpoint
      const sampleDoc = documents[0];
      console.log(`\n3. Testing regular download for document: ${sampleDoc.originalName}`);
      console.log(`   Document ID: ${sampleDoc._id}`);
      
      const downloadResponse = await axios.get(`${API_BASE}/documents/${sampleDoc._id}/download`);
      if (downloadResponse.data.downloadUrl) {
        console.log('✅ Regular download endpoint working');
        console.log(`   Download URL generated: ${downloadResponse.data.downloadUrl.substring(0, 50)}...`);
      } else {
        console.log('❌ Regular download endpoint failed - no download URL');
      }
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  Download endpoints require authentication - this is expected');
        console.log('   Error: Unauthorized (401)');
      } else {
        console.log(`❌ Error testing downloads: ${error.message}`);
      }
    }

    // Test 2: Check QR bundles
    console.log('\n4. Fetching sample QR bundles...');
    try {
      const bundlesResponse = await axios.get(`${API_BASE}/qr`);
      const bundles = bundlesResponse.data.bundles || bundlesResponse.data || [];
      
      if (bundles.length === 0) {
        console.log('❌ No QR bundles found in the system');
        return;
      }
      
      console.log(`✅ Found ${bundles.length} QR bundles`);
      const sampleBundle = bundles[0];
      console.log(`   Sample bundle: ${sampleBundle.title}`);
      console.log(`   Bundle UUID: ${sampleBundle.uuid}`);
      
      if (sampleBundle.documents && sampleBundle.documents.length > 0) {
        const bundleDoc = sampleBundle.documents[0];
        console.log(`\n5. Testing QR download for document: ${bundleDoc.originalName || 'Unknown'}`);
        console.log(`   Document ID: ${bundleDoc._id || 'Missing'}`);
        
        if (bundleDoc._id) {
          const qrDownloadResponse = await axios.get(`${API_BASE}/documents/${bundleDoc._id}/qr-download?qrUuid=${sampleBundle.uuid}`);
          if (qrDownloadResponse.data.downloadUrl) {
            console.log('✅ QR download endpoint working');
            console.log(`   Download URL generated: ${qrDownloadResponse.data.downloadUrl.substring(0, 50)}...`);
          } else {
            console.log('❌ QR download endpoint failed - no download URL');
          }
        } else {
          console.log('❌ Document in bundle missing _id field');
        }
      } else {
        console.log('⚠️  QR bundle has no documents to test');
      }
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  QR bundle endpoints require authentication - this is expected');
      } else {
        console.log(`❌ Error testing QR bundles: ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ General error: ${error.message}`);
  }

  console.log('\n🏁 Download endpoint test completed');
}

// Run the test
if (require.main === module) {
  testDownloadEndpoints();
}

module.exports = { testDownloadEndpoints };
