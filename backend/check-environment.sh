#!/bin/bash

# QRLocker Environment Configuration Checker
echo "🔍 QRLocker Environment Configuration Check"
echo "==========================================="

# Check if we're in the backend directory
if [ ! -f "server.js" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

echo ""
echo "📁 Current Directory: $(pwd)"
echo ""

# Check for .env file
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "⚠️  .env file not found (this might be okay if using system environment variables)"
fi

echo ""
echo "🔧 Current Environment Variables:"
echo "================================="

# Function to check and display environment variable
check_env_var() {
    local var_name=$1
    local var_value=$(printenv $var_name)
    
    if [ -n "$var_value" ]; then
        if [[ $var_name == *"SECRET"* ]] || [[ $var_name == *"PASSWORD"* ]] || [[ $var_name == *"KEY"* ]]; then
            # Mask sensitive values
            echo "✅ $var_name = [MASKED]"
        else
            echo "✅ $var_name = $var_value"
        fi
    else
        echo "❌ $var_name = NOT SET"
    fi
}

# Check critical environment variables
echo ""
echo "🌐 URL Configuration:"
check_env_var "FRONTEND_URL"
check_env_var "BACKEND_URL"

echo ""
echo "🗄️  Database Configuration:"
check_env_var "MONGODB_URI"
check_env_var "MONGO_URI"

echo ""
echo "☁️  AWS Configuration:"
check_env_var "AWS_ACCESS_KEY_ID"
check_env_var "AWS_SECRET_ACCESS_KEY"
check_env_var "AWS_REGION"
check_env_var "AWS_S3_BUCKET_NAME"
check_env_var "AWS_BUCKET_NAME"

echo ""
echo "🔐 Security Configuration:"
check_env_var "JWT_SECRET"
check_env_var "QR_HMAC_SECRET"

echo ""
echo "📧 Email Configuration:"
check_env_var "EMAIL_FROM"

echo ""
echo "🚀 Application Configuration:"
check_env_var "NODE_ENV"
check_env_var "PORT"

echo ""
echo "🔍 Analysis:"
echo "============"

# Check FRONTEND_URL specifically
FRONTEND_URL=$(printenv FRONTEND_URL)
if [ -n "$FRONTEND_URL" ]; then
    if [[ $FRONTEND_URL == *"s3-website"* ]] || [[ $FRONTEND_URL == *"amazonaws.com"* ]]; then
        echo "❌ CRITICAL: FRONTEND_URL is pointing to S3 static hosting!"
        echo "   Current: $FRONTEND_URL"
        echo "   This is likely causing your QR code 404 errors."
        echo "   FRONTEND_URL should point to your application server, not S3."
        echo ""
        echo "🔧 Recommended fixes:"
        echo "   1. If using a custom domain: FRONTEND_URL=https://yourdomain.com"
        echo "   2. If using server IP: FRONTEND_URL=https://your-server-ip"
        echo "   3. If using load balancer: FRONTEND_URL=https://your-load-balancer-url"
    elif [[ $FRONTEND_URL == "http://localhost"* ]]; then
        echo "⚠️  WARNING: FRONTEND_URL is set to localhost"
        echo "   Current: $FRONTEND_URL"
        echo "   This will not work in production. Update to your production URL."
    else
        echo "✅ FRONTEND_URL looks reasonable: $FRONTEND_URL"
    fi
else
    echo "❌ FRONTEND_URL is not set - this will cause QR code generation issues"
    echo "   Default fallback is http://localhost:3000"
fi

# Check MongoDB connection
MONGODB_URI=$(printenv MONGODB_URI)
MONGO_URI=$(printenv MONGO_URI)
if [ -z "$MONGODB_URI" ] && [ -z "$MONGO_URI" ]; then
    echo "❌ No MongoDB connection string found (MONGODB_URI or MONGO_URI)"
fi

# Check AWS configuration
AWS_ACCESS_KEY_ID=$(printenv AWS_ACCESS_KEY_ID)
AWS_S3_BUCKET_NAME=$(printenv AWS_S3_BUCKET_NAME)
AWS_BUCKET_NAME=$(printenv AWS_BUCKET_NAME)

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ AWS credentials not configured - S3 uploads will fail"
fi

if [ -z "$AWS_S3_BUCKET_NAME" ] && [ -z "$AWS_BUCKET_NAME" ]; then
    echo "❌ No S3 bucket name configured"
fi

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Update FRONTEND_URL to your correct application URL"
echo "2. Restart your application server"
echo "3. Run the QR URL update script: node update-qr-urls.js"
echo "4. Test creating a new QR bundle to verify the fix"

echo ""
echo "ℹ️  For more details, see: PRODUCTION_FIX.md"
