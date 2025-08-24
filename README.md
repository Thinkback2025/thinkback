# Knets - Enhanced Family Device Management System

A comprehensive family device management application with advanced multi-layer location tracking, real-time device control, and intelligent parental controls.

## Features

### 🌍 Enhanced Location Tracking
- **4-tier location system**: GPS → Network → Cell Tower → IP Geolocation
- Works regardless of device location settings
- Parent-controlled activation (no continuous tracking)
- Multiple accuracy levels from 3m to 50km

### 📱 Device Management
- Real-time device lock/unlock
- Screen time tracking and scheduling
- Network restrictions (WiFi/mobile data control)
- App blocking capabilities
- Remote device administration

### 👨‍👩‍👧‍👦 Family Features
- Multi-child device management
- Individual device control cards
- Shared schedule management
- Activity logging and monitoring
- Parent code system for secure device connection

### 🔐 Security & Privacy
- Replit OAuth authentication
- Secure parent-child device pairing
- Device admin protection with secret codes
- Time manipulation protection
- SIM swap security measures

### 💳 Subscription Management
- Tiered subscription system with trial periods
- UPI payment integration with QR codes
- Child limit upgrades
- Automatic invoice generation via email

## Technology Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Node.js + Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Mobile**: Native Android APK with PWA fallback
- **Authentication**: Replit OAuth with session management
- **Payments**: UPI integration with real-time monitoring

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Android SDK (for APK building)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/knets.git
cd knets
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Configure your environment variables
```

4. Set up the database
```bash
npm run db:push
```

5. Start the development server
```bash
npm run dev
```

### Building Android APK

```bash
chmod +x build_enhanced_location_apk.sh
./build_enhanced_location_apk.sh
```

## Project Structure

```
├── client/                 # React frontend
├── server/                 # Express backend
├── shared/                 # Shared types and schemas
├── knets-minimal-android/  # Android source code
├── migrations/             # Database migrations
└── public/                 # Static assets
```

## Key Components

### Enhanced Location System
- Multi-layer location detection with intelligent fallback
- GPS, Network, Cell Tower, and IP geolocation methods
- Battery-optimized one-time location requests

### Device Administration
- Native Android device admin capabilities
- Remote lock/unlock functionality
- Network control and app blocking
- Schedule-based restrictions

### Parent Dashboard
- Real-time device monitoring
- Location tracking with method indicators
- Schedule management interface
- Activity logs and analytics

## Configuration

### Database Setup
The application uses PostgreSQL with Drizzle ORM. Configure your database connection in the environment variables.

### Android APK Configuration
Update server URLs in the Android code before building:
- Development: `https://your-replit-domain.replit.dev`
- Production: `https://your-production-domain.com`

### Payment Integration
Configure UPI payment settings:
- Update UPI ID in pricing configuration
- Set up Amazon SES for invoice delivery

## Deployment

### Replit Deployment
1. Deploy to Replit using the provided configuration
2. Set up environment variables in Replit Secrets
3. Configure PostgreSQL database connection

### Production Deployment
1. Build the frontend: `npm run build`
2. Deploy backend to your hosting platform
3. Set up PostgreSQL database
4. Configure environment variables
5. Build and distribute Android APK

## Android Permissions

The Android application requires the following permissions:
- Location access (fine and coarse)
- Phone state access (for IMEI and cell tower data)
- Device admin permissions
- Network state access
- Notification permissions (Android 13+)

## Security Considerations

- All API communication uses HTTPS
- Device admin protection prevents uninstallation
- Parent codes are securely generated and validated
- Location data is only collected on parent request
- No sensitive data is stored locally on child devices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For technical support or questions:
- Create an issue in this repository
- Check the documentation in the `/docs` folder
- Review the comprehensive test suite for examples

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.