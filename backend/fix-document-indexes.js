const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const fixDocumentIndexes = async () => {
  try {
    console.log('Connecting to database...');
    const conn = await connectDB();
    
    console.log('Dropping existing qrId index...');
    const result = await conn.connection.db.collection('documents').dropIndex('qrId_1');
    console.log('Index dropped result:', result);
    
    console.log('Creating new sparse index for qrId...');
    await conn.connection.db.collection('documents').createIndex(
      { qrId: 1 }, 
      { sparse: true, background: true }
    );
    
    console.log('Successfully fixed document indexes!');
  } catch (error) {
    console.error(`Error fixing indexes: ${error.message}`);
    if (error.codeName === 'IndexNotFound') {
      console.log('Index does not exist, no need to drop it.');
    }
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
};

// Run the function
fixDocumentIndexes();
