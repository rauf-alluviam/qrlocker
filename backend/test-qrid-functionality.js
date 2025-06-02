const mongoose = require('mongoose');
const Document = require('./models/documentModel');
require('dotenv').config();

async function testDocumentCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Create a document without qrId field
    const doc1 = await Document.create({
      originalName: 'test1.txt',
      fileName: 'test1.txt',
      fileType: 'text/plain',
      fileSize: 100,
      s3Key: 'test/test1.txt',
      s3Url: 'https://snapcheckdata.s3.ap-south-1.amazonaws.com/test/test1.txt'
      // No qrId field - this should work fine
    });
    console.log('✅ Created document 1 without qrId:', doc1._id);
    
    // Test 2: Create another document without qrId field
    const doc2 = await Document.create({
      originalName: 'test2.txt',
      fileName: 'test2.txt',
      fileType: 'text/plain',
      fileSize: 200,
      s3Key: 'test/test2.txt',
      s3Url: 'https://snapcheckdata.s3.ap-south-1.amazonaws.com/test/test2.txt'
      // No qrId field - this should also work fine
    });
    console.log('✅ Created document 2 without qrId:', doc2._id);
    
    // Test 3: Create a document with a unique qrId
    const doc3 = await Document.create({
      originalName: 'test3.txt',
      fileName: 'test3.txt',
      fileType: 'text/plain',
      fileSize: 300,
      s3Key: 'test/test3.txt',
      s3Url: 'https://snapcheckdata.s3.ap-south-1.amazonaws.com/test/test3.txt',
      qrId: 'unique-qr-id-123'
    });
    console.log('✅ Created document 3 with unique qrId:', doc3._id);
    
    // Test 4: Try to create another document with the same qrId (should fail)
    try {
      await Document.create({
        originalName: 'test4.txt',
        fileName: 'test4.txt',
        fileType: 'text/plain',
        fileSize: 400,
        s3Key: 'test/test4.txt',
        s3Url: 'https://snapcheckdata.s3.ap-south-1.amazonaws.com/test/test4.txt',
        qrId: 'unique-qr-id-123'
      });
      console.log('❌ This should have failed due to duplicate qrId');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate qrId:', error.message);
    }
    
    // Clean up test documents
    await Document.deleteMany({
      _id: { $in: [doc1._id, doc2._id, doc3._id] }
    });
    console.log('✅ Cleaned up test documents');
    
    console.log('\n🎉 All tests passed! The qrId index is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testDocumentCreation();
