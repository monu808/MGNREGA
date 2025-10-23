# Quick Setup Guide for MGNREGA Performance Tracker

## Local Development Setup (Windows)

### Prerequisites
1. **Install Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Install PostgreSQL** (v15 or higher)
   - Download from: https://www.postgresql.org/download/windows/
   - During installation, note down your postgres password
   - Verify: `psql --version`

3. **Install Git**
   - Download from: https://git-scm.com/downloads

### Step-by-Step Setup

#### 1. Database Setup
Open PowerShell as Administrator and run:

```powershell
# Connect to PostgreSQL
psql -U postgres

# In PostgreSQL prompt, run:
CREATE DATABASE mgnrega_db;
\q
```

Now initialize the schema:
```powershell
cd d:\MGNREGA\MGNREGA
psql -U postgres -d mgnrega_db -f database\schema.sql
```

#### 2. Backend Setup
```powershell
# Navigate to backend directory
cd d:\MGNREGA\MGNREGA\backend

# Install dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# Edit .env file with your settings:
# - Set DB_PASSWORD to your PostgreSQL password
# - Keep other settings as default for development

# Seed the database with sample data
npm run seed

# Start the backend server
npm run dev
```

The backend should now be running at `http://localhost:5000`

#### 3. Frontend Setup
Open a new PowerShell window:

```powershell
# Navigate to frontend directory
cd d:\MGNREGA\MGNREGA\frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend should now be running at `http://localhost:5173`

### Testing the Application

1. Open your browser and go to `http://localhost:5173`
2. You should see the MGNREGA homepage
3. Try the "Auto-detect my location" button (you may need to allow location access)
4. Or manually select a district from the list
5. View district performance metrics
6. Try the comparison feature
7. Switch between English and Hindi

### Troubleshooting

**Backend won't start:**
- Check if PostgreSQL is running: `Get-Service postgresql*`
- Verify database credentials in `.env`
- Check if port 5000 is available

**Frontend won't start:**
- Check if backend is running at `http://localhost:5000/api/health`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and run `npm install` again

**Database connection errors:**
- Ensure PostgreSQL service is running
- Verify DB_PASSWORD in backend/.env matches your PostgreSQL password
- Check if database `mgnrega_db` exists: `psql -U postgres -l`

## Production Deployment

For production deployment on a VPS/VM, refer to `DEPLOYMENT.md` for detailed instructions.

### Quick Docker Deployment

If you have Docker installed:

```powershell
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Seed database
docker-compose exec backend npm run seed
```

Access the application at `http://localhost`

## Next Steps

1. **Customize Districts**: Edit `database/schema.sql` to add more UP districts or districts from other states
2. **Configure API**: Add real data.gov.in API credentials in backend/.env
3. **Branding**: Update colors and logos in the frontend
4. **Deploy**: Follow DEPLOYMENT.md to deploy to a VPS

## Features Implemented

✅ **User-Friendly Interface**
- Large icons and visual indicators
- Minimal text, maximum visuals
- Color-coded performance levels
- Hindi and English language support

✅ **Auto-Location Detection (Bonus)**
- Uses browser geolocation API
- Finds nearest district automatically
- Fallback to manual selection

✅ **Production-Ready Architecture**
- Caching for performance
- Rate limiting for protection
- Database connection pooling
- Error handling and logging
- Scheduled data synchronization

✅ **Offline-First Design**
- Local data caching
- Works even if API is down
- Historical data stored locally

✅ **Accessibility Features**
- Text-to-speech support
- High contrast mode support
- Screen reader friendly
- Keyboard navigation

## Project Structure
```
MGNREGA/
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── config/    # Configuration files
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
├── database/          # Database schema
├── docker-compose.yml # Docker orchestration
├── DEPLOYMENT.md      # Deployment guide
└── README.md          # Main documentation
```

## Key Technologies

- **Frontend**: React 18, Vite, Chart.js, React Router
- **Backend**: Node.js, Express, PostgreSQL
- **Deployment**: Docker, Nginx
- **Caching**: Node-Cache (in-memory)
- **Scheduling**: node-cron

## Data Source

All data is sourced from data.gov.in's official MGNREGA API. Sample data is included for testing purposes.

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review logs in `backend/logs/`
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed

## License

MIT License - See LICENSE file
