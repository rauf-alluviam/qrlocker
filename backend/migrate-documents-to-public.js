#!/usr/bin/env node

/**
 * Migration script to update existing documents from private to public access
 * This script makes existing documents publicly accessible by updating their S3 ACL
 */

const AWS = require('aws-sdk');
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

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET_NAME;

async function updateDocumentAcl(s3Key) {
  try {
    if (!BUCKET_NAME) {
      throw new Error('Bucket name not configured. Please set AWS_BUCKET_NAME or S3_BUCKET_NAME environment variable.');
    }
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ACL: 'public-read'
    };

    await s3.putObjectAcl(params).promise();
    console.log(`✓ Updated ACL for: ${s3Key}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to update ACL for ${s3Key}:`, error.message);
    return false;
  }
}

async function migrateDocuments() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');

    // Verify configuration
    console.log(`Using S3 bucket: ${BUCKET_NAME}`);
    console.log(`Using AWS region: ${process.env.AWS_REGION || 'us-east-1'}`);
    
    if (!BUCKET_NAME) {
      throw new Error('AWS_BUCKET_NAME environment variable is not set');
    }

    // Get all documents
    console.log('Fetching all documents...');
    const documents = await Document.find({});
    console.log(`Found ${documents.length} documents to process`);

    let successCount = 0;
    let failureCount = 0;

    // Process documents in batches to avoid overwhelming S3
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)}`);
      
      const promises = batch.map(async (document) => {
        if (!document.s3Key) {
          console.log(`⚠ Skipping document ${document._id} - no S3 key`);
          return false;
        }

        const success = await updateDocumentAcl(document.s3Key);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
        return success;
      });

      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('MIGRATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`Total documents processed: ${documents.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed to update: ${failureCount}`);
    
    if (failureCount > 0) {
      console.log('\n⚠ Some documents failed to update. Check the logs above for details.');
      console.log('You may need to manually update these documents or run the script again.');
    } else {
      console.log('\n✓ All documents have been successfully updated to public access!');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the migration
if (require.main === module) {
  console.log('Starting document migration to public access...');
  console.log('This will update all existing documents to be publicly accessible via direct S3 URLs\n');
  
  migrateDocuments();
}

module.exports = { migrateDocuments, updateDocumentAcl };
