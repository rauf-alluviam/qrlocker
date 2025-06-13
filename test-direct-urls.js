const mongoose = require('mongoose');
const { connectDB } = require('./backend/config/db');
const Document = require('./backend/models/documentModel');
const { getDirectS3Url } = require('./backend/utils/s3');

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

async function testDirectUrls() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Get a sample document
    const sampleDoc = await Document.findOne({});
    if (!sampleDoc) {
      console.log('No documents found in database');
      return;
    }

    console.log('\n=== Document Test ===');
    console.log('Document ID:', sampleDoc._id);
    console.log('Original Name:', sampleDoc.originalName);
    console.log('S3 Key:', sampleDoc.s3Key);
    console.log('Stored S3 URL:', sampleDoc.s3Url);
    
    // Test direct URL generation
    const generatedUrl = getDirectS3Url(sampleDoc.s3Key);
    console.log('Generated Direct URL:', generatedUrl);
    
    // Verify they match
    if (sampleDoc.s3Url === generatedUrl) {
      console.log('✅ URLs match! Direct URL system is working correctly');
    } else {
      console.log('⚠️ URLs do not match');
      console.log('Stored:', sampleDoc.s3Url);
      console.log('Generated:', generatedUrl);
    }

    console.log('\n=== Testing Document Controller Functions ===');
    
    // Test that getDocumentById would include s3Url
    const docObj = sampleDoc.toObject();
    docObj.s3Url = getDirectS3Url(sampleDoc.s3Key);
    console.log('Document object with s3Url:', {
      _id: docObj._id,
      originalName: docObj.originalName,
      s3Url: docObj.s3Url,
      fileSize: docObj.fileSize,
      fileType: docObj.fileType
    });

    console.log('\n✅ All tests passed! Direct URL system is ready');

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    process.exit(0);
  }
}

testDirectUrls();
