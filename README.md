# MGNREGA District Performance Tracker

## Project Overview
A production-ready web application for rural Indian citizens to easily understand their district's performance in the MGNREGA program. Designed for low-literacy users with simple, visual interfaces.

## Features
- 📍 **Auto-detect user district** using geolocation (bonus feature)
- 📊 **Visual performance indicators** with simple icons and colors
- 📈 **Historical trends** showing past performance
- 🔄 **Offline-first** with local caching to handle API downtime
- 🌐 **Multi-language support** for regional languages
- 📱 **Responsive design** for mobile and desktop
- ⚡ **Production-ready** with proper error handling and rate limiting

## Technical Architecture

### Backend (Node.js + Express)
- RESTful API server
- PostgreSQL database for data persistence
- Redis for caching and rate limiting
- Scheduled cron jobs for data synchronization
- Error handling and logging

### Frontend (React + Vite)
- Simple, intuitive UI for low-literacy users
- Visual indicators (icons, colors) instead of complex text
- Charts using Chart.js for data visualization
- Geolocation API for automatic district detection
- Progressive Web App (PWA) capabilities

### Deployment
- Docker containers for easy deployment
- Nginx as reverse proxy
- PM2 for process management
- Environment-based configuration

## Project Structure
```
MGNREGA/
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # API controllers
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helper functions
│   │   └── index.js      # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── utils/        # Helper functions
│   │   └── main.jsx      # Entry point
│   ├── Dockerfile
│   └── package.json
├── database/             # Database scripts
│   └── schema.sql
├── nginx/                # Nginx configuration
│   └── nginx.conf
├── docker-compose.yml    # Docker orchestration
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (for containerized deployment)

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd MGNREGA
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Setup Database**
```bash
psql -U postgres -f database/schema.sql
```

### Production Deployment

1. **Build and run with Docker**
```bash
docker-compose up -d
```

2. **Access the application**
- Frontend: http://your-server-ip
- Backend API: http://your-server-ip/api

## API Endpoints

- `GET /api/states` - Get list of states
- `GET /api/districts/:stateId` - Get districts by state
- `GET /api/performance/:districtId` - Get district performance data
- `GET /api/performance/:districtId/history` - Get historical data
- `GET /api/districts/nearby` - Get nearby districts based on location

## Key Design Decisions

### 1. Caching Strategy
- **Redis caching** for frequently accessed data
- **Database storage** for historical data
- **Scheduled sync** (every 6 hours) from data.gov.in API
- **Graceful degradation** when API is down

### 2. Rate Limiting
- Redis-based rate limiting to prevent API abuse
- Backoff strategy for failed API calls
- Queue system for batch data updates

### 3. UI/UX for Low Literacy
- **Visual indicators**: Green ✅ (Good), Yellow ⚠️ (Average), Red ❌ (Poor)
- **Simple icons**: 👷 for workers, 💰 for wages, 📋 for job cards
- **Minimal text**: Large fonts, clear labels
- **Voice support**: Text-to-speech for explanations
- **Regional languages**: Hindi, Tamil, Telugu, Bengali, etc.

### 4. Data Freshness
- Primary data source: Local database
- Background sync every 6 hours
- Fallback to cached data if API fails
- Last updated timestamp displayed

### 5. Scalability
- Horizontal scaling with Docker/K8s
- Database connection pooling
- CDN for static assets
- Load balancing with Nginx

## State Selection
**Uttar Pradesh** - Selected as the focus state for this implementation as it:
- Has the highest number of MGNREGA beneficiaries
- Represents diverse rural demographics
- Has 75 districts for meaningful comparisons

## Future Enhancements
- SMS/WhatsApp notifications for updates
- Grievance filing system
- Comparison with neighboring districts
- Predictive analytics for performance trends
- Offline mobile app with sync

## License
MIT License

## Contributing
Pull requests are welcome. For major changes, please open an issue first.

## Contact
For questions or support, please open an issue on GitHub.
