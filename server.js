const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'spark-it-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/login');
  }
};

// API authentication middleware (for API calls)
const requireApiAuth = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Database setup
const dbPath = path.join(__dirname, 'database', 'images.db');
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(dbPath);

// Initialize database schema only if database doesn't exist
if (!fs.existsSync(dbPath)) {
  console.log('Database not found, creating new database...');
  db.serialize(() => {
    const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
    schema.split(';').forEach(stmt => {
      if (stmt.trim()) {
        db.run(stmt.trim());
      }
    });
    console.log('Database initialized successfully');
  });
} else {
  console.log('Database already exists, using existing database');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, HEIC, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Maximum 10 files at once
  },
  fileFilter: fileFilter
});

// Utility functions
function calculateChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function generateUploadToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Password configuration
const PASSWORD_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'; // Hash of "20Vinc08:)"

// Authentication Routes

// Login page
app.get('/login', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Login API
app.post('/api/login', express.urlencoded({ extended: true }), async (req, res) => {
  const { password } = req.body;
  
  try {
    const isValid = await bcrypt.compare(password, PASSWORD_HASH);
    
    if (isValid) {
      req.session.isAuthenticated = true;
      req.session.authTime = new Date().toISOString();
      res.json({ success: true, redirect: '/' });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout API
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
    } else {
      res.clearCookie('connect.sid');
      res.json({ success: true, redirect: '/login' });
    }
  });
});

// Check authentication status
app.get('/api/auth-status', (req, res) => {
  res.json({
    isAuthenticated: !!req.session.isAuthenticated,
    authTime: req.session.authTime || null
  });
});

// API Routes

// Upload images
app.post('/api/upload', requireApiAuth, upload.array('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedImages = [];
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    for (const file of req.files) {
      try {
        // Calculate checksum
        const fileBuffer = fs.readFileSync(file.path);
        const checksum = calculateChecksum(fileBuffer);

        // Check for duplicates
        const existingImage = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM images WHERE checksum = ?', [checksum], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (existingImage) {
          // Remove duplicate file
          fs.unlinkSync(file.path);
          continue;
        }

        // Get image dimensions using sharp
        let width, height;
        try {
          const metadata = await sharp(fileBuffer).metadata();
          width = metadata.width;
          height = metadata.height;
        } catch (err) {
          console.warn('Could not read image dimensions:', err.message);
        }

        // Generate upload token
        const uploadToken = generateUploadToken();

        // Insert into database
        const imageId = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO images (filename, original_filename, file_path, file_size, mime_type, width, height, ip_address, user_agent, upload_token, checksum)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              file.filename,
              file.originalname,
              file.path,
              file.size,
              file.mimetype,
              width,
              height,
              clientIp,
              userAgent,
              uploadToken,
              checksum
            ],
            function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            }
          );
        });

        uploadedImages.push({
          id: imageId,
          filename: file.filename,
          originalFilename: file.originalname,
          url: `/uploads/${file.filename}`,
          uploadToken: uploadToken
        });

      } catch (error) {
        console.error('Error processing file:', file.originalname, error);
        // Clean up file if processing failed
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    res.json({
      success: true,
      images: uploadedImages,
      count: uploadedImages.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get all images
app.get('/api/images', requireApiAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const images = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, filename, original_filename, file_size, mime_type, width, height, uploaded_at
         FROM images 
         WHERE is_approved = 1 
         ORDER BY uploaded_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const totalCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM images WHERE is_approved = 1', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    res.json({
      images: images.map(img => ({
        ...img,
        url: `/uploads/${img.filename}`
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Delete image (by upload token)
app.delete('/api/images/:token', requireApiAuth, async (req, res) => {
  try {
    const token = req.params.token;

    const image = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM images WHERE upload_token = ?', [token], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file
    if (fs.existsSync(image.file_path)) {
      fs.unlinkSync(image.file_path);
    }

    // Delete from database
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM images WHERE upload_token = ?', [token], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Serve uploaded files (protected)
app.use('/uploads', requireAuth, express.static(uploadsDir));

// Main page (protected)
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Spark'it server running on port ${PORT}`);
  console.log(`Upload directory: ${uploadsDir}`);
  console.log(`Database: ${dbPath}`);
});
