const mongoose = require('mongoose');
const QRBundle = require('./models/qrBundleModel');
const { generateAndUploadQR } = require('./utils/qrCodeGenerator');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function updateQRUrls() {
  try {
    console.log('🔄 Starting QR URL update process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Verify FRONTEND_URL is set correctly
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error('❌ FRONTEND_URL environment variable is not set!');
      console.log('Please set FRONTEND_URL to your correct application URL (e.g., https://yourdomain.com)');
      process.exit(1);
    }
    
    if (frontendUrl.includes('s3-website') || frontendUrl.includes('amazonaws.com')) {
      console.warn('⚠️  WARNING: FRONTEND_URL appears to be pointing to S3 static hosting!');
      console.log('Current FRONTEND_URL:', frontendUrl);
      console.log('This should be your application URL, not S3 static website URL.');
      console.log('Please update FRONTEND_URL environment variable and try again.');
      process.exit(1);
    }
    
    console.log('✅ FRONTEND_URL looks correct:', frontendUrl);
    
    // Get all QR bundles
    const bundles = await QRBundle.find({});
    console.log(`📊 Found ${bundles.length} QR bundles to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const bundle of bundles) {
      try {
        // Check if QR code URL needs updating
        const currentQrUrl = bundle.qrCodeUrl;
        const expectedUrlPattern = `${frontendUrl}/scan/${bundle.uuid}`;
        
        if (currentQrUrl && currentQrUrl.includes(frontendUrl)) {
          console.log(`⏭️  Skipping ${bundle.title} - URL already correct`);
          skippedCount++;
          continue;
        }
        
        console.log(`🔄 Updating QR bundle: ${bundle.title}`);
        console.log(`   Old URL: ${currentQrUrl}`);
        
        // Generate new QR code with correct URL
        const { qrCodeUrl, signature } = await generateAndUploadQR(
          bundle.uuid,
          frontendUrl
        );
        
        // Update the bundle
        bundle.qrCodeUrl = qrCodeUrl;
        bundle.hmacSignature = signature;
        await bundle.save();
        
        console.log(`   New URL: ${qrCodeUrl}`);
        console.log(`✅ Updated successfully`);
        updatedCount++;
        
        // Small delay to avoid overwhelming S3
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error updating bundle ${bundle.title}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${bundles.length}`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 QR URL update completed successfully!');
      console.log('All QR codes now point to the correct application URL.');
    } else if (skippedCount === bundles.length) {
      console.log('\n✅ All QR codes were already using the correct URL.');
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Fatal error during QR URL update:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Process interrupted. Cleaning up...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Process terminated. Cleaning up...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the update
if (require.main === module) {
  updateQRUrls();
}

module.exports = updateQRUrls;
