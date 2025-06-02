const QRCode = require('qrcode');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Generate HMAC signature for QR code URL
const generateSignature = (data) => {
  const hmac = crypto.createHmac('sha256', process.env.QR_HMAC_SECRET);
  hmac.update(data);
  return hmac.digest('hex');
};

// Verify HMAC signature
const verifySignature = (data, signature) => {
  const expectedSignature = generateSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

// Generate QR code and upload to S3
const generateAndUploadQR = async (uuid, baseUrl) => {
  try {
    // Generate QR URL with signature
    const signature = generateSignature(uuid);
    const qrUrl = `${baseUrl}/qr/${uuid}?sig=${signature}`;
    
    // Generate QR code
    const qrBuffer = await QRCode.toBuffer(qrUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    
    // Upload to S3
    const key = `qrcodes/${uuid}.png`;
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: qrBuffer,
      ContentType: 'image/png',
      ACL: 'public-read',
    });
    
    const result = await s3Client.send(uploadCommand);
    
    // Construct the S3 URL
    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const qrCodeUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    
    return {
      qrCodeUrl,
      signature,
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

module.exports = {
  generateSignature,
  verifySignature,
  generateAndUploadQR,
};