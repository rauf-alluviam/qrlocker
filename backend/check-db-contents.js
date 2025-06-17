const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkDatabaseContents() {
  try {
    console.log('🔍 Checking Database Contents...\n');

    // Check connection
    console.log('📡 MongoDB Connection State:', mongoose.connection.readyState);
    console.log('📡 Database Name:', mongoose.connection.name);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections in database:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Check qrusers collection
    const qrusersCount = await mongoose.connection.db.collection('qrusers').countDocuments();
    console.log(`\n👤 qrusers collection count: ${qrusersCount}`);

    if (qrusersCount > 0) {
      const qrusers = await mongoose.connection.db.collection('qrusers').find({}).toArray();
      console.log('👤 qrusers:');
      qrusers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
        console.log(`    Organization: ${user.organization || 'None'}, Department: ${user.department || 'None'}`);
      });
    }

    // Check documents collection
    const documentsCount = await mongoose.connection.db.collection('documents').countDocuments();
    console.log(`\n📄 documents collection count: ${documentsCount}`);

    if (documentsCount > 0) {
      const documents = await mongoose.connection.db.collection('documents').find({}).limit(5).toArray();
      console.log('📄 documents (first 5):');
      documents.forEach(doc => {
        console.log(`  - ID: ${doc._id}`);
        console.log(`    Name: ${doc.originalName}`);
        console.log(`    Uploaded By: ${doc.uploadedBy || 'None'}`);
        console.log(`    Organization: ${doc.organization || 'None'}`);
        console.log(`    Department: ${doc.department || 'None'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabaseContents();
