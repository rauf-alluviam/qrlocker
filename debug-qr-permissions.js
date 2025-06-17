const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/userModel');
const Document = require('./backend/models/documentModel');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugQRPermissions() {
  try {
    console.log('🔍 Debugging QR Bundle Permission Issues...\n');

    // List all users
    console.log('📋 All Users:');
    const users = await User.find({}).select('name email role organization department');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      console.log(`    Organization: ${user.organization || 'None'}, Department: ${user.department || 'None'}`);
    });

    console.log('\n📋 All Documents:');
    const documents = await Document.find({}).select('originalName uploadedBy organization department');
    documents.forEach(doc => {
      console.log(`  - ID: ${doc._id}`);
      console.log(`    Name: ${doc.originalName}`);
      console.log(`    Uploaded By: ${doc.uploadedBy || 'None'}`);
      console.log(`    Organization: ${doc.organization || 'None'}`);
      console.log(`    Department: ${doc.department || 'None'}`);
      console.log('');
    });

    // Test permission query for each user with each document
    console.log('🔐 Testing Permissions:');
    for (const user of users) {
      console.log(`\n👤 User: ${user.name} (${user.role})`);
      
      for (const doc of documents) {
        let permissionQuery = {
          _id: doc._id
        };

        if (user.role === 'admin') {
          // Admins can include any document
          console.log(`  ✅ Admin can access document: ${doc.originalName}`);
        } else if (user.role === 'supervisor') {
          // Supervisors can include documents from their organization
          permissionQuery.$or = [
            { uploadedBy: user._id },
            { organization: user.organization }
          ];
          
          const canAccess = await Document.findOne(permissionQuery);
          console.log(`  ${canAccess ? '✅' : '❌'} Supervisor ${canAccess ? 'can' : 'cannot'} access: ${doc.originalName}`);
          if (!canAccess) {
            console.log(`    Reason: Not uploaded by user (${doc.uploadedBy}) and org mismatch (user: ${user.organization}, doc: ${doc.organization})`);
          }
        } else {
          // Regular users can include documents they uploaded or from their department/organization
          permissionQuery.$or = [
            { uploadedBy: user._id },
            { department: user.department },
            { organization: user.organization }
          ];
          
          const canAccess = await Document.findOne(permissionQuery);
          console.log(`  ${canAccess ? '✅' : '❌'} User ${canAccess ? 'can' : 'cannot'} access: ${doc.originalName}`);
          if (!canAccess) {
            console.log(`    Reason: Not uploaded by user, dept mismatch (user: ${user.department}, doc: ${doc.department}), org mismatch (user: ${user.organization}, doc: ${doc.organization})`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

debugQRPermissions();
