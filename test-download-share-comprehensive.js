// Comprehensive test for download and share functionality
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function testDocumentFunctionality() {
  console.log('='.repeat(60));
  console.log('TESTING DOCUMENT DOWNLOAD & SHARE FUNCTIONALITY');
  console.log('='.repeat(60));

  try {
    console.log('\n🔐 Step 1: Authentication Test');
    
    // First, we need to authenticate to get a token
    const email = await askQuestion('Enter your email: ');
    const password = await askQuestion('Enter your password: ');
    
    console.log('\nTesting authentication...');
    const authResponse = await axios.post('http://localhost:9002/api/users/auth', {
      email,
      password
    });
    
    const token = authResponse.data.token;
    console.log('✅ Authentication successful');
    
    // Set up axios with auth header
    const apiClient = axios.create({
      baseURL: 'http://localhost:9002/api',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n📄 Step 2: Fetching Documents');
    
    // Test document listing
    const documentsResponse = await apiClient.get('/documents');
    const documents = documentsResponse.data.documents;
    
    console.log(`✅ Found ${documents.length} documents`);
    
    if (documents.length === 0) {
      console.log('❌ No documents found. Please upload some documents first.');
      rl.close();
      return;
    }
    
    // Check first document
    const firstDoc = documents[0];
    console.log('\n🔍 Step 3: Analyzing First Document');
    console.log(`Document ID: ${firstDoc._id}`);
    console.log(`Original Name: ${firstDoc.originalName}`);
    console.log(`File Type: ${firstDoc.fileType}`);
    console.log(`S3 Key: ${firstDoc.s3Key}`);
    console.log(`S3 URL: ${firstDoc.s3Url}`);
    
    if (!firstDoc.s3Url) {
      console.log('❌ ERROR: Document does not have s3Url field!');
      console.log('This explains why download buttons are not working.');
    } else {
      console.log('✅ Document has s3Url field');
    }
    
    console.log('\n🔗 Step 4: Testing Document Details API');
    
    // Test individual document fetch
    const documentResponse = await apiClient.get(`/documents/${firstDoc._id}`);
    const document = documentResponse.data;
    
    console.log(`Document details s3Url: ${document.s3Url}`);
    
    if (!document.s3Url) {
      console.log('❌ ERROR: Document details API does not return s3Url!');
    } else {
      console.log('✅ Document details API returns s3Url');
    }
    
    console.log('\n📥 Step 5: Testing Download URL API');
    
    // Test download URL endpoint
    const downloadResponse = await apiClient.get(`/documents/${firstDoc._id}/url`);
    console.log(`Download URL: ${downloadResponse.data.url}`);
    console.log(`Signed URL: ${downloadResponse.data.signedUrl}`);
    
    console.log('\n🔗 Step 6: Testing Share Functionality');
    
    // Test QR bundle creation
    const shareResponse = await apiClient.post('/qr', {
      title: `Test Share: ${firstDoc.originalName}`,
      description: `Test shared document: ${firstDoc.originalName}`,
      documents: [firstDoc._id],
      isPublic: true,
      hasPasscode: false,
      customMessage: 'This is a test shared document.'
    });
    
    const qrBundle = shareResponse.data;
    console.log(`✅ QR Bundle created: ${qrBundle._id}`);
    console.log(`QR Bundle title: ${qrBundle.title}`);
    console.log(`QR Bundle reused: ${qrBundle.reused || false}`);
    
    console.log('\n✅ SUMMARY:');
    console.log('1. Authentication: Working');
    console.log(`2. Document listing: Working (${documents.length} docs)`);
    console.log(`3. Document s3Url in list: ${firstDoc.s3Url ? 'Working' : 'BROKEN'}`);
    console.log(`4. Document details s3Url: ${document.s3Url ? 'Working' : 'BROKEN'}`);
    console.log('5. Download URL API: Working');
    console.log('6. Share functionality: Working');
    
    if (!firstDoc.s3Url || !document.s3Url) {
      console.log('\n❌ ISSUE IDENTIFIED:');
      console.log('The s3Url field is missing from document responses.');
      console.log('This is why the download buttons show "looking for document id".');
      console.log('The frontend is trying to use document.s3Url but it\'s undefined.');
    } else {
      console.log('\n✅ All functionality appears to be working correctly!');
    }
    
  } catch (error) {
    console.error('\n❌ Error during testing:', error.response?.data || error.message);
  } finally {
    rl.close();
  }
}

// Run the test
testDocumentFunctionality();
