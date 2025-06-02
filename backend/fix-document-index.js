// Script to update the qrId index to be sparse
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function fixDocumentIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/qrlocker');
    console.log('Connected to MongoDB');
    
    // Drop the existing index
    console.log('Dropping qrId_1 index...');
    await mongoose.connection.collection('documents').dropIndex('qrId_1');
    console.log('Index dropped successfully');
    
    // Create a new sparse index
    console.log('Creating new sparse index on qrId...');
    await mongoose.connection.collection('documents').createIndex(
      { qrId: 1 },
      { 
        sparse: true, // This allows multiple documents with null values
        unique: true, // Only unique values when qrId is not null
        background: true
      }
    );
    
    console.log('Index created successfully');
    
    // Verify the indexes
    const indexes = await mongoose.connection.collection('documents').indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixDocumentIndex();
