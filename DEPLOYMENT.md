# Deployment Guide for Spark'it

## Quick Start (GitHub Deployment)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Spark'it
```

### 2. Setup and Start
```bash
# Install dependencies and initialize database
npm run setup

# Start the server
npm start
```

### 3. Access the Application
- Open: `http://localhost:3000`
- Login with: `20Vinc08:)`

## Detailed Setup Instructions

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn
- Git

### Environment Configuration

1. **Copy environment template:**
```bash
cp .env.example .env
```

2. **Edit .env file (optional for development):**
```env
PORT=3000
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

### Database Setup

The database is automatically initialized on first run, but you can also do it manually:

```bash
npm run init-db
```

### File Structure After Setup
```
Spark'it/
|-- server.js                 # Main server file
|-- package.json              # Dependencies and scripts
|-- index.html               # Main application
|-- login.html               # Login page
|-- database/
|   |-- schema.sql           # Database schema
|   |-- images.db           # SQLite database (auto-created)
|-- uploads/                # Image uploads (auto-created)
|-- scripts/
|   |-- init-database.js    # Database initialization
|   |-- generate-password-hash.js # Utility script
|-- .env.example            # Environment template
|-- .gitignore              # Git ignore rules
|-- README.md              # Documentation
|-- DEPLOYMENT.md           # This file
```

## Production Deployment

### Environment Variables
Set these in your hosting environment:

```bash
PORT=3000
SESSION_SECRET=your-secure-random-string-here
NODE_ENV=production
```

### Security Notes
- Change the default session secret in production
- The password `20Vinc08:)` is hardcoded in server.js - modify if needed
- Sessions expire after 24 hours
- All routes require authentication

### Platform-Specific Deployment

#### Heroku
```bash
# Create app
heroku create your-app-name

# Set environment variables
heroku config:set SESSION_SECRET=your-secure-secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### Vercel
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

#### Railway
1. Connect repository to Railway
2. Set environment variables
3. Deploy automatically

#### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run init-db
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in .env file
   - Or kill existing process: `kill $(lsof -ti:3000)`

2. **Database errors**
   - Delete database: `rm database/images.db`
   - Reinitialize: `npm run init-db`

3. **Permission errors**
   - Ensure uploads directory is writable
   - Check database directory permissions

4. **Session issues**
   - Clear browser cookies
   - Restart server after changing SESSION_SECRET

### Logs and Debugging

```bash
# Development with auto-restart
npm run dev

# Check logs
npm start

# Database status
ls -la database/
```

## Features Verification

After deployment, test these features:

1. **Authentication**
   - Login with `20Vinc08:)`
   - Logout functionality
   - Session persistence

2. **Image Gallery**
   - Upload images (JPEG, PNG, HEIC, WebP)
   - View gallery
   - Delete images

3. **Idea Generator**
   - Category selection
   - Idea generation
   - Admin panel (Archive)

4. **Responsive Design**
   - Mobile compatibility
   - Tablet layout
   - Desktop experience

## Backup and Maintenance

### Database Backup
```bash
# Backup database
cp database/images.db database/images.backup.db

# Restore
cp database/images.backup.db database/images.db
```

### Image Backup
```bash
# Backup uploads
tar -czf uploads-backup.tar.gz uploads/
```

## Support

For issues:
1. Check this guide first
2. Review logs for error messages
3. Verify environment configuration
4. Test with fresh database setup
