# Changelog

All notable changes to the Knets Family Device Management System will be documented in this file.

## [2.0.0] - 2025-08-24

### Added - Enhanced Multi-Layer Location Tracking

#### 🌍 4-Tier Location System
- **GPS Location**: ±3-5m accuracy for outdoor precision
- **Network Location**: ±10-100m accuracy via WiFi/cellular triangulation  
- **Cell Tower Triangulation**: ±150-500m accuracy without location services
- **IP Geolocation**: ±5-50km universal fallback method

#### 🧠 Intelligent Features
- Automatic method progression: GPS → Network → Cell → IP
- Smart caching of recent location data
- Method-specific timeout handling
- Graceful degradation on permission denial

#### 🔐 Privacy & Security
- Parent-controlled activation only
- One-time location requests (no continuous tracking)
- Secure HTTPS transmission
- No sensitive data persistence on device

### Enhanced Components

#### Android
- New `EnhancedLocationService.java` with multi-layer detection
- Updated `ServerPollingService.java` for enhanced integration
- Enhanced Android manifest with improved permissions

#### Server
- New `/api/knets-jr/cell-location` endpoint
- Enhanced location data processing
- Android ID to IMEI mapping logic

#### Frontend
- Updated dashboard with enhanced location indicators
- Visual display of all 4 location methods
- Real-time accuracy information

### Technical Improvements
- Battery-optimized one-time requests
- Intelligent service lifecycle management
- Multi-service IP geolocation fallback
- Comprehensive error handling and logging

---

## [1.x] - Previous Versions

### [1.5.0] - Android 13+ Compatibility
- Target SDK 34 compatibility
- Enhanced permission handling
- OnBackInvokedCallback support
- Scoped storage compliance

### [1.4.0] - Manual IMEI Collection
- Enhanced Step 1 workflow with database verification
- Manual IMEI input field with instructions
- Two-phase verification system
- Improved UI behavior and validation

### [1.3.0] - Device Name Display Fix
- Fixed device registration to show actual names
- Updated device mapping logic
- Automatic device record updates

### [1.2.0] - Payment System Enhancements
- Fixed payment history and invoice calculations
- Corrected child limit default values
- Enhanced invoice system with proper fee distinction

### [1.1.0] - Core System Completion
- Real-time device control and monitoring
- Screen time tracking and scheduling
- Network restrictions and app blocking
- Subscription management with UPI payments
- Parent-child device pairing system

### [1.0.0] - Initial Release
- Basic family device management
- Device registration and monitoring
- Simple location tracking
- User authentication and management