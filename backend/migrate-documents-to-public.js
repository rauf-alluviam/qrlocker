#!/usr/bin/env node

/**
 * Migration script to update existing documents from private to public access
 * This script makes existing documents publicly accessible by updating their S3 ACL
 */

const { S3Client, PutObjectAclCommand } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');
const Document = require('./models/documentModel');
require('dotenv').config();

// Simple database connection function for migration
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Configure AWS S3 with SDK v3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;

async function updateDocumentAcl(s3Key) {
  try {
    if (!BUCKET_NAME) {
      throw new Error('Bucket name not configured. Please set AWS_BUCKET_NAME or AWS_S3_BUCKET_NAME environment variable.');
    }
    
    const command = new PutObjectAclCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ACL: 'public-read'
    });

    await s3Client.send(command);
    console.log(`✓ Updated ACL for: ${s3Key}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to update ACL for ${s3Key}:`, error.message);
    return false;
  }
}

async function migrateDocuments() {
  try {
    await connectDB();
    
    console.log('🔍 Finding documents to migrate...');
    const documents = await Document.find({}).select('s3Key originalName');
    
    if (documents.length === 0) {
      console.log('No documents found to migrate.');
      process.exit(0);
    }
    
    console.log(`📄 Found ${documents.length} documents to process`);
    
    let successCount = 0;
    let failureCount = 0;
    
    // Process documents in batches to avoid API limits
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)}...`);
      
      const promises = batch.map(async (doc) => {
        const success = await updateDocumentAcl(doc.s3Key);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        return success;
      });
      
      await Promise.all(promises);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully updated: ${successCount} documents`);
    console.log(`❌ Failed to update: ${failureCount} documents`);
    
    if (failureCount > 0) {
      console.log('\n⚠️ Some documents failed to update. Check the errors above.');
      console.log('You may need to manually update the ACL for those files in the S3 console.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateDocuments();
}

module.exports = migrateDocuments;
