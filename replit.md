# Memocare - Alzheimer's Care Assistant

## Overview

Memocare is a comprehensive web application designed specifically for Alzheimer's patients and their caregivers. The application provides essential tools for medication tracking, memory exercises, emergency alerts, and daily care management. Built with accessibility in mind, it features a large, high-contrast interface optimized for seniors, voice-to-text functionality, and real-time notifications to support independent living while keeping caregivers informed.

The application combines memory care functionality with safety features, including contact management, location tracking, medication compliance monitoring, and emergency alert systems. It serves as a digital companion that helps users maintain their routines, preserve memories, and stay connected with their support network.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built using React 18 with TypeScript, utilizing a modern component-based architecture with shadcn/ui components for consistent design. The frontend employs Wouter for lightweight routing and TanStack Query for efficient server state management and caching. Real-time features are implemented using Socket.io client for instant notifications and updates.

The UI is specifically designed for accessibility with large touch targets, high contrast colors, and clear typography optimized for seniors. Voice recognition capabilities are integrated using the Web Speech API for hands-free interaction, while camera functionality leverages the native `navigator.mediaDevices.getUserMedia` API for photo capture and identification features.

### Backend Architecture
The server runs on Express.js with TypeScript, providing a RESTful API structure with dedicated route handlers for each feature domain (auth, medications, contacts, etc.). The backend implements session-based authentication using express-session with SQLite session storage for simplicity and reliability.

Real-time communication is handled through Socket.io, enabling instant delivery of reminders, emergency alerts, and system notifications. The scheduler system uses node-cron to manage recurring reminders and medication alerts, with flexible cron expression support for complex scheduling needs.

### Data Storage Solutions
The application uses SQLite as the primary database with Drizzle ORM for type-safe database operations. The database schema supports comprehensive user data including medications, contacts, locations, journal entries, memory items, routines, and emergency alerts. File uploads (photos, videos, audio) are stored locally using Multer middleware with organized directory structure.

The SQLite choice provides excellent performance for single-user scenarios while maintaining data integrity and supporting complex queries. The schema is designed to be easily extensible for future features while maintaining referential integrity through proper foreign key relationships.

### Authentication and Authorization
Authentication is implemented using express-session with bcrypt for password hashing. The system maintains user sessions through SQLite session storage, providing persistent login across browser sessions. Route protection is implemented through middleware that validates session state before allowing access to protected resources.

The authentication system is designed for simplicity and reliability, avoiding complex OAuth flows that might confuse elderly users while maintaining security best practices for password storage and session management.

### Real-time Communication
Socket.io provides bidirectional communication between client and server for instant notifications. The system supports user-specific channels for targeted message delivery, enabling features like medication reminders, emergency alerts, and real-time status updates. Connection management includes automatic reconnection and user room assignment based on authentication state.

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with TypeScript support
- **Express.js**: Backend web framework with TypeScript
- **Socket.io**: Real-time bidirectional communication
- **Drizzle ORM**: Type-safe database operations with SQLite
- **TanStack Query**: Server state management and caching

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui components**: Pre-built accessible UI components based on Radix UI
- **Radix UI primitives**: Low-level accessible UI primitives
- **Lucide React**: Icon library for consistent iconography

### Authentication and Security
- **bcrypt**: Password hashing and verification
- **express-session**: Session management middleware
- **connect-sqlite3**: SQLite session store adapter

### File Handling and Storage
- **Multer**: Multipart form data handling for file uploads
- **Better SQLite3**: Synchronous SQLite database driver
- **Local file system**: Photo, video, and audio storage

### Scheduling and Utilities
- **node-cron**: Task scheduling for reminders and recurring events
- **nanoid**: Unique ID generation for various entities
- **cors**: Cross-origin resource sharing configuration

### Browser APIs
- **Web Speech API**: Voice recognition and text-to-speech
- **MediaDevices API**: Camera and microphone access
- **Geolocation API**: Location tracking and positioning services
- **File API**: File upload and processing capabilities

The application is designed to work primarily with local resources to ensure reliability and privacy, minimizing external service dependencies while providing comprehensive functionality for Alzheimer's care management.