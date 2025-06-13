// Test script to check document API response
const axios = require('axios');

async function testDocumentAPI() {
    try {
        console.log('Testing document API...');
        
        // Test without auth first
        try {
            const response = await axios.get('http://localhost:9002/api/documents');
            console.log('API Response (no auth):', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('No auth failed:', error.response?.status, error.response?.data);
        }
        
        // Test with a specific document ID
        try {
            const response = await axios.get('http://localhost:9002/api/documents/675b6dd27e21a6ac0fbf2dd0');
            console.log('Single document response:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.log('Single document failed:', error.response?.status, error.response?.data);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testDocumentAPI();
