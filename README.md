# QRLocker 2.0

QRLocker is a full-stack, QR code-based document management platform that enables secure document sharing through QR codes with advanced access control and analytics features.

## Core Features

- **Document Upload & Storage**: Multi-file upload with S3 storage and optimization capabilities
- **QR Bundle Creation**: Group documents under a single QR code with custom access settings
- **Message with Document**: Allow users to attach a custom message or note when sharing a document or a QR bundle. This message will be shown when the recipient opens the QR or accesses the document page.
- **Access Control**: Secure documents with passcodes, expiry dates, and view limits
- **Organization Hierarchy**: Multi-level access control with organizations, departments, and user roles
- **Analytics Dashboard**: Track document views, QR scans, and user activity
- **Document Requests**: External users can request documents through a form
- **Approval Workflows**: Implement approval processes for document publishing

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Zustand for state management
- Chart.js for analytics

### Backend
- Node.js + Express.js
- MongoDB
- JWT Authentication
- S3 for document storage
- Amazon SES for email

### DevOps
- Docker
- GitHub Actions CI/CD
- EC2 deployment

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- AWS Account with S3 and SES access
- Docker and Docker Compose (for containerized deployment)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your configuration details
3. Install dependencies:

```bash
npm install
cd frontend && npm install
```

### Development

Run the backend and frontend in development mode:

```bash
# Run backend server
npm run server

# Run frontend client
npm run client

# Run both together
npm run dev
```

### Production Deployment

The application can be deployed using Docker:

```bash
# Build and start containers
docker-compose up -d
```

## CI/CD Pipeline

The project includes GitHub Actions workflows for:
- Code linting
- Running tests
- Building the application
- Deploying to EC2

## Security Features

- JWT-based authentication
- Two-factor authentication for admin users
- HMAC signatures for QR links
- Role-based access control
- Complete audit logs
- S3 private storage with signed URLs

## License

This project is licensed under the MIT License - see the LICENSE file for details.