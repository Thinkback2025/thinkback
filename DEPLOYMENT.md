# Deployment Guide

## Quick Deploy to Replit

1. **Import to Replit**
   - Create new Repl from GitHub repository
   - Select Node.js template

2. **Configure Environment**
   ```bash
   # Set up environment variables in Replit Secrets
   DATABASE_URL=your-postgresql-connection-string
   SESSION_SECRET=your-session-secret
   # Add other required environment variables
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set up Database**
   ```bash
   npm run db:push
   ```

5. **Start Application**
   ```bash
   npm run dev
   ```

## Production Deployment

### Backend Deployment

1. **Prepare Environment**
   ```bash
   # Build the application
   npm run build
   
   # Set production environment variables
   export NODE_ENV=production
   export DATABASE_URL=your-production-db-url
   ```

2. **Database Setup**
   ```bash
   # Run database migrations
   npm run db:push
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Frontend Deployment

The frontend is served by the Express server in production mode. No separate deployment needed.

### Android APK Deployment

1. **Configure Server URLs**
   ```bash
   # Edit Android source files to use production URLs
   # Update server base URL in EnhancedLocationService.java
   ```

2. **Build APK**
   ```bash
   chmod +x build_enhanced_location_apk.sh
   ./build_enhanced_location_apk.sh
   ```

3. **Distribute APK**
   - Upload to Google Play Store, or
   - Distribute directly via download link

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Authentication  
SESSION_SECRET=random-secure-string
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.com

# Email (Optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
SES_FROM_EMAIL=noreply@yourdomain.com
```

### Development vs Production

**Development:**
- Uses Vite dev server for frontend
- Hot reload enabled
- Debug logging active

**Production:**
- Serves built frontend from Express
- Optimized assets and caching
- Error logging only

## Database Configuration

### PostgreSQL Setup

1. **Create Database**
   ```sql
   CREATE DATABASE knets;
   CREATE USER knets_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE knets TO knets_user;
   ```

2. **Configure Connection**
   ```bash
   DATABASE_URL=postgresql://knets_user:secure_password@localhost:5432/knets
   ```

3. **Run Migrations**
   ```bash
   npm run db:push
   ```

## Security Checklist

- [ ] Set strong SESSION_SECRET
- [ ] Use HTTPS in production
- [ ] Configure proper CORS settings
- [ ] Set up rate limiting
- [ ] Enable database connection pooling
- [ ] Configure environment-specific logging
- [ ] Set up monitoring and alerting

## Performance Optimization

1. **Database Optimization**
   - Enable connection pooling
   - Add database indexes for frequent queries
   - Configure query timeout limits

2. **Frontend Optimization**
   - Enable gzip compression
   - Configure proper caching headers
   - Use CDN for static assets

3. **Android Optimization**
   - Minimize APK size
   - Optimize background services
   - Configure efficient polling intervals

## Monitoring

### Health Checks

The application provides health check endpoints:
- `/health` - Basic health status
- `/api/health` - API health with database connectivity

### Logging

Configure logging levels:
- Development: DEBUG
- Production: INFO and above

### Metrics

Monitor key metrics:
- Database connection pool usage
- API response times
- Authentication success rates
- Location update frequency

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify DATABASE_URL format
- Check network connectivity
- Confirm database server is running

**Authentication Not Working**
- Verify REPL_ID and domain configuration
- Check Replit OAuth settings
- Ensure session secret is set

**Android APK Build Failed**
- Install Android SDK
- Configure ANDROID_HOME environment variable
- Check Gradle configuration

**Location Tracking Not Working**
- Verify Android permissions
- Check server endpoint accessibility
- Review location service logs