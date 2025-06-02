const mongoose = require('mongoose');
require('dotenv').config();

const fixQrIdIndex = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Check if qrId_1 index exists
    const qrIdIndex = indexes.find(index => index.name === 'qrId_1');
    
    if (qrIdIndex) {
      console.log('Found qrId_1 index:', qrIdIndex);
      
      // Check if it's a sparse index
      if (!qrIdIndex.sparse) {
        console.log('Index is not sparse, dropping it...');
        await collection.dropIndex('qrId_1');
        console.log('Dropped qrId_1 index');
        
        // Create a new sparse index
        console.log('Creating new sparse index for qrId...');
        await collection.createIndex({ qrId: 1 }, { sparse: true, background: true });
        console.log('Created new sparse index for qrId');
      } else {
        console.log('Index is already sparse, no changes needed');
      }
    } else {
      console.log('qrId_1 index not found, creating sparse index...');
      await collection.createIndex({ qrId: 1 }, { sparse: true, background: true });
      console.log('Created sparse index for qrId');
    }

    // Verify the final indexes
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', finalIndexes);

    console.log('Index fix completed successfully');
  } catch (error) {
    console.error('Error fixing qrId index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the fix
fixQrIdIndex();
