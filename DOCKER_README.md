# Pearson Pub Frontend - Docker Setup

This directory contains the production-ready Docker configuration for the React + Vite frontend application.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │
│   React + Vite  │◄──►│    NestJS       │
│   Port: 3002    │    │   Port: 5000    │
│   (Nginx)       │    │                 │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Linux/Mac

1. **Setup environment**:

   ```bash
   cp .env.example .env
   nano .env  # Edit with your backend API URL
   ```

2. **Deploy**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh deploy
   ```

### Windows

1. **Setup environment**:

   ```cmd
   copy .env.example .env
   notepad .env
   ```

2. **Deploy**:
   ```cmd
   deploy.bat deploy
   ```

## 📋 Configuration

### Required Environment Variables

```bash
# Frontend Configuration
FRONTEND_PORT=3002

# Backend API URL - IMPORTANT!
VITE_API_URL=http://localhost:5000

# Build Configuration
NODE_ENV=production
GENERATE_SOURCEMAP=false
```

### Important Notes

⚠️ **Before deployment:**

- Ensure `VITE_API_URL` points to your running backend
- If using different domains, configure CORS on the backend
- For production, use HTTPS URLs (e.g., `https://api.yourdomain.com`)

## 🛠️ Available Commands

### Linux/Mac (`./deploy.sh`)

```bash
./deploy.sh deploy     # Deploy frontend
./deploy.sh status     # Show service status
./deploy.sh logs       # Show frontend logs
./deploy.sh stop       # Stop frontend service
./deploy.sh restart    # Restart frontend service
./deploy.sh test-api   # Test backend API connection
```

### Windows (`deploy.bat`)

```cmd
deploy.bat deploy      # Deploy frontend
deploy.bat status      # Show service status
deploy.bat logs        # Show frontend logs
deploy.bat stop        # Stop frontend service
deploy.bat test-api    # Test backend API connection
```

### Manual Docker Commands

```bash
# Deploy
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f frontend

# Stop
docker-compose down

# Rebuild (if code changes)
docker-compose build --no-cache frontend
docker-compose up -d
```

## 🔍 Service URLs

After deployment, your frontend will be available at:

- **Frontend App**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

## 🔧 Development Workflow

### Making Code Changes

When you update your React code:

```bash
# Rebuild and redeploy
./deploy.sh update

# Or manually
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Testing API Connection

```bash
# Test if backend is reachable
./deploy.sh test-api

# Or manually check
curl http://localhost:5000/health
```

## 🐛 Troubleshooting

### Common Issues

**Port 3002 already in use:**

```bash
# Check what's using the port
netstat -tulpn | grep :3002  # Linux/Mac
netstat -an | findstr :3002  # Windows

# Change port in .env file
FRONTEND_PORT=3003
```

**Frontend shows "Network Error":**

```bash
# Check backend is running
curl http://localhost:5000/health

# Verify API URL in .env
cat .env | grep VITE_API_URL

# Check CORS settings on backend
```

**Build fails:**

```bash
# Check build logs
docker-compose logs frontend

# Common fixes:
# 1. Clean Docker cache
docker system prune -f

# 2. Rebuild without cache
docker-compose build --no-cache frontend
```

**Nginx not serving files:**

```bash
# Check Nginx configuration
docker-compose exec frontend nginx -t

# Check if files were built
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Health Checks

```bash
# Quick status check
docker-compose ps

# Test frontend health
curl http://localhost:3002/health

# Test API connectivity
curl http://localhost:5000/health
```

## 📊 Production Considerations

### Performance

- Static files are served by Nginx with optimal caching
- Gzip compression enabled for better performance
- Production build optimizations applied

### Security

- Security headers configured in Nginx
- Frontend runs as non-root user
- No sensitive information in frontend build

### Monitoring

- Health check endpoint available
- Nginx access and error logs available
- Frontend build logs accessible via Docker

## 🔄 Frontend + Backend Setup

### Complete Setup Process

1. **First, deploy the backend**:

   ```bash
   cd ../the_pearson_pub
   ./deploy.sh deploy
   ```

2. **Verify backend is running**:

   ```bash
   curl http://localhost:5000/health
   ```

3. **Then deploy the frontend**:

   ```bash
   cd ../the_pearson_pub_admin_dashboard
   ./deploy.sh deploy
   ```

4. **Test the complete setup**:
   ```bash
   ./deploy.sh test-api
   ```

### Environment Configuration

Make sure your environment variables match:

**Backend (.env)**:

```bash
BACKEND_PORT=5000
FRONTEND_URL=http://localhost:3002
```

**Frontend (.env)**:

```bash
FRONTEND_PORT=3002
VITE_API_URL=http://localhost:5000
```

## 🌐 Production Deployment

For production servers:

1. **Use HTTPS URLs**:

   ```bash
   # Frontend .env
   VITE_API_URL=https://api.yourdomain.com
   ```

2. **Configure proper domains**:

   ```bash
   # Backend .env
   FRONTEND_URL=https://admin.yourdomain.com
   ```

3. **Set up reverse proxy** (optional):
   - Use Nginx or Apache to handle SSL termination
   - Configure load balancing if needed

## 📞 Support

**Frontend not loading?**

1. Check `docker-compose logs frontend`
2. Verify port 3002 is not in use
3. Test with `curl http://localhost:3002`

**API calls failing?**

1. Check backend is running: `curl http://localhost:5000/health`
2. Verify `VITE_API_URL` in `.env` file
3. Check browser console for CORS errors

**Build issues?**

1. Check Node.js dependencies in `package.json`
2. Verify TypeScript compilation
3. Rebuild with `docker-compose build --no-cache frontend`

**Nginx configuration issues?**

1. Test config: `docker-compose exec frontend nginx -t`
2. Check Nginx logs: `docker-compose logs frontend`
3. Verify file permissions in container
