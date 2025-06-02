const mongoose = require('mongoose');
const Document = require('./models/documentModel');
require('dotenv').config();

const testDocumentCreation = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Test creating multiple documents with null qrId
    console.log('Testing document creation with null qrId...');
    
    const testDoc1 = await Document.create({
      originalName: 'test1.txt',
      fileName: 'test1.txt',
      fileType: 'text/plain',
      fileSize: 100,
      s3Key: 'test/test1.txt',
      s3Url: 'https://bucket.s3.region.amazonaws.com/test/test1.txt',
      qrId: null,
    });
    console.log('Created document 1:', testDoc1._id);

    const testDoc2 = await Document.create({
      originalName: 'test2.txt',
      fileName: 'test2.txt',
      fileType: 'text/plain',
      fileSize: 200,
      s3Key: 'test/test2.txt',
      s3Url: 'https://bucket.s3.region.amazonaws.com/test/test2.txt',
      qrId: null,
    });
    console.log('Created document 2:', testDoc2._id);

    console.log('✅ Successfully created multiple documents with null qrId');

    // Clean up test documents
    await Document.deleteMany({ _id: { $in: [testDoc1._id, testDoc2._id] } });
    console.log('🧹 Cleaned up test documents');

  } catch (error) {
    console.error('❌ Error testing document creation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

testDocumentCreation();
