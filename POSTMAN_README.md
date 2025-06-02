# QRLocker API Postman Collection

This Postman collection provides complete API testing coverage for the QRLocker application, including authentication, document management, QR code generation, and analytics.

## Files Included

- `QRLocker_API_Collection.postman_collection.json` - Main collection with all API endpoints
- `QRLocker_Environment.postman_environment.json` - Environment variables for easy testing

## Import Instructions

1. Open Postman
2. Click "Import" button
3. Select both JSON files:
   - `QRLocker_API_Collection.postman_collection.json`
   - `QRLocker_Environment.postman_environment.json`
4. The collection and environment will be imported automatically

## Environment Setup

The environment file includes the following variables:
- `base_url`: API base URL (default: `http://localhost:5000/api`)
- `auth_token`: JWT token (auto-filled after login)
- `user_id`: Current user ID (auto-filled)
- `organization_id`: Organization ID (auto-filled)
- `department_id`: Department ID (auto-filled)
- `document_id`: Document ID (auto-filled)
- `qr_bundle_id`: QR Bundle ID (auto-filled)
- `qr_uuid`: QR Bundle UUID (auto-filled)
- `request_id`: Document Request ID (auto-filled)

## Testing Workflow

### 1. Setup Organization Structure
1. **Create Organization** - Creates a new organization
2. **Create Department** - Creates a department within the organization

### 2. User Authentication
1. **Register User** - Create a new user account
2. **Login User** - Authenticate and get JWT token
3. **Get User Profile** - Retrieve current user information

### 3. Document Management
1. **Upload Documents** - Upload one or more documents
2. **Get All Documents** - List all documents (admin/supervisor)
3. **Get My Documents** - List current user's documents
4. **Get Document by ID** - Retrieve specific document details
5. **Update Document** - Modify document metadata
6. **Delete Document** - Remove a document

### 4. QR Code Management
1. **Create QR Bundle** - Create a QR code bundle with documents
2. **Get QR Bundle by UUID** - Public endpoint to view QR bundle
3. **Verify Passcode** - Public endpoint to verify access passcode
4. **Update QR Bundle** - Modify QR bundle settings
5. **Approve/Reject QR Bundle** - Admin approval workflow

### 5. Document Requests
1. **Create Document Request** - Public endpoint for external requests
2. **Get All Requests** - List all requests (admin/supervisor)
3. **Update Request Status** - Change request status
4. **Assign Request** - Assign request to a user
5. **Respond to Request** - Send response with documents/QR codes

### 6. Analytics
1. **Get QR Scan Stats** - QR code scanning statistics
2. **Get Document View Stats** - Document viewing analytics
3. **Get Top QR Bundles** - Most popular QR bundles
4. **Get Top Documents** - Most accessed documents
5. **Get User Activity** - Individual user analytics
6. **Get Department Activity** - Department-level analytics

## Collection Features

### Auto-Variable Population
The collection includes test scripts that automatically populate environment variables:
- Login/Register responses set `auth_token` and `user_id`
- Organization creation sets `organization_id`
- Department creation sets `department_id`
- Document upload sets `document_id`
- QR bundle creation sets `qr_bundle_id` and `qr_uuid`
- Request creation sets `request_id`

### Authentication
- Most endpoints require authentication via Bearer token
- Token is automatically included from `auth_token` variable
- Public endpoints (login, register, document requests, QR viewing) don't require authentication

### Role-Based Access
The collection includes requests that require specific roles:
- **Admin only**: User management, organization/department CRUD
- **Admin/Supervisor**: Document management, request management, advanced analytics
- **User**: Basic operations, personal documents, personal QR bundles

## API Endpoints Overview

### Authentication & Users (`/api/users`)
- `POST /` - Register user
- `POST /login` - Login user
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /2fa/setup` - Setup 2FA
- `POST /2fa/verify` - Verify 2FA
- `POST /2fa/disable` - Disable 2FA
- `GET /` - Get all users (admin)
- `GET /:id` - Get user by ID (admin)
- `PUT /:id` - Update user (admin)
- `DELETE /:id` - Delete user (admin)

### Organizations (`/api/organizations`)
- `POST /` - Create organization (admin)
- `GET /` - Get all organizations
- `GET /:id` - Get organization by ID
- `PUT /:id` - Update organization (admin)
- `DELETE /:id` - Delete organization (admin)

### Departments (`/api/organizations/:orgId/departments`)
- `POST /` - Create department (admin)
- `GET /` - Get all departments
- `GET /:id` - Get department by ID
- `PUT /:id` - Update department (admin)
- `DELETE /:id` - Delete department (admin)

### Documents (`/api/documents`)
- `POST /upload` - Upload documents
- `GET /` - Get all documents (admin/supervisor)
- `GET /me` - Get my documents
- `GET /department/:id` - Get department documents
- `GET /:id` - Get document by ID
- `GET /:id/url` - Get document signed URL
- `PUT /:id` - Update document
- `POST /:id/optimize` - Optimize image
- `DELETE /:id` - Delete document

### QR Codes (`/api/qr`)
- `POST /` - Create QR bundle
- `GET /` - Get all QR bundles (admin/supervisor)
- `GET /me` - Get my QR bundles
- `GET /department/:id` - Get department QR bundles
- `GET /view/:uuid` - Get QR bundle by UUID (public)
- `POST /verify-passcode/:uuid` - Verify passcode (public)
- `GET /:id` - Get QR bundle by ID
- `PUT /:id` - Update QR bundle
- `POST /:id/regenerate-passcode` - Regenerate passcode
- `POST /:id/send-passcode` - Send passcode by email
- `POST /:id/approve` - Approve QR bundle (admin/supervisor)
- `POST /:id/reject` - Reject QR bundle (admin/supervisor)
- `DELETE /:id` - Delete QR bundle

### Document Requests (`/api/requests`)
- `POST /` - Create document request (public)
- `GET /` - Get all requests (admin/supervisor)
- `GET /me` - Get my requests
- `GET /:id` - Get request by ID (admin/supervisor)
- `PUT /:id/status` - Update request status (admin/supervisor)
- `PUT /:id/assign` - Assign request (admin/supervisor)
- `POST /:id/respond` - Respond to request (admin/supervisor)

### Analytics (`/api/analytics`)
- `GET /scans` - QR scan statistics
- `GET /views` - Document view statistics
- `GET /top-qr` - Top QR bundles
- `GET /top-documents` - Top documents
- `GET /time-of-day` - Scans by time (admin/supervisor)
- `GET /location` - Scans by location (admin/supervisor)
- `GET /user/:id` - User activity (admin/supervisor)
- `GET /department/:id` - Department activity

## Sample Request Bodies

### Register User
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "organizationId": "org_id",
  "departmentId": "dept_id"
}
```

### Create Organization
```json
{
  "name": "Acme Corporation",
  "type": "private",
  "address": "123 Business St, City, State",
  "contactEmail": "contact@acme.com",
  "contactPhone": "+1-555-0123"
}
```

### Upload Documents
- Uses `multipart/form-data`
- Include files and metadata fields

### Create QR Bundle
```json
{
  "title": "Sample QR Bundle",
  "description": "This is a sample QR bundle",
  "documentIds": ["doc_id_1", "doc_id_2"],
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "maxScans": 100,
  "requirePasscode": true,
  "allowedDomains": ["example.com"]
}
```

### Create Document Request
```json
{
  "requesterName": "John Smith",
  "requesterEmail": "john.smith@example.com",
  "requesterPhone": "+1-555-0123",
  "organizationName": "External Company",
  "documentType": "Contract",
  "description": "I need access to contract documents",
  "urgency": "medium",
  "expectedDate": "2025-06-15"
}
```

## Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

Error responses include a `message` field with details about the error.

## Rate Limiting

The API implements rate limiting (100 requests per 15 minutes per IP). If you hit the rate limit, wait for the window to reset or use different IPs for testing.

## Notes

1. Make sure your backend server is running on `http://localhost:5000`
2. Update the `base_url` environment variable if using a different host/port
3. Some endpoints require specific roles - ensure you're logged in with appropriate permissions
4. File uploads require actual files in the form data
5. The collection automatically manages authentication tokens
6. Variables are automatically populated from successful responses

## Troubleshooting

1. **401 Unauthorized**: Make sure you're logged in and have a valid token
2. **403 Forbidden**: Check if your user role has permission for the endpoint
3. **404 Not Found**: Verify the endpoint URL and ensure required resources exist
4. **Rate Limited**: Wait for the rate limit window to reset
5. **CORS Issues**: Ensure the backend has proper CORS configuration

Happy testing! 🚀
