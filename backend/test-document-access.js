const mongoose = require('mongoose');
const Document = require('./models/documentModel');
require('dotenv').config();

async function testDocumentData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Find the specific document
    const document = await Document.findById('684c136333b3ba2f426e4549');
    
    if (document) {
      console.log('Document found:');
      console.log('- ID:', document._id);
      console.log('- Original Name:', document.originalName);
      console.log('- S3 Key:', document.s3Key);
      console.log('- S3 URL:', document.s3Url);
      console.log('- File Type:', document.fileType);
      console.log('- File Size:', document.fileSize);
      
      // Test if the S3 URL is accessible
      const https = require('https');
      const http = require('http');
      
      const protocol = document.s3Url.startsWith('https:') ? https : http;
      
      console.log('\nTesting S3 URL accessibility...');
      const req = protocol.request(document.s3Url, { method: 'HEAD' }, (res) => {
        console.log('- Status Code:', res.statusCode);
        console.log('- Content Type:', res.headers['content-type']);
        console.log('- Content Length:', res.headers['content-length']);
        
        if (res.statusCode === 200) {
          console.log('✅ Document is publicly accessible!');
        } else {
          console.log('❌ Document is not accessible');
        }
        
        mongoose.connection.close();
      });
      
      req.on('error', (error) => {
        console.log('❌ Error accessing S3 URL:', error.message);
        mongoose.connection.close();
      });
      
      req.end();
      
    } else {
      console.log('Document not found with ID: 684c136333b3ba2f426e4549');
      mongoose.connection.close();
    }
    
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

testDocumentData();
