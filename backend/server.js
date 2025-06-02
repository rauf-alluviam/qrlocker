const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors());

// Rate limiting
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10000, // Limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Apply rate limiting to all routes
// app.use(apiLimiter);

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/organizations', require('./routes/organizationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/internal-requests', require('./routes/internalRequestRoutes'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) =>
    res.sendFile(
      path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')
    )
  );
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.yellow.bold);
});