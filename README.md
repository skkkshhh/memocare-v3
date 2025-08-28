# Memocare - Alzheimer's Care Assistant

A comprehensive web application designed specifically for Alzheimer's patients and their caregivers. Memocare provides essential tools for medication tracking, memory exercises, emergency alerts, and daily routine management.

## Features

### Core Functionality
- **Medication Management**: Track medications, log doses, and view compliance history
- **Reminder System**: Customizable reminders with cron scheduling for medications, appointments, and tasks
- **Contact Management**: People cards with photos, relationships, and quick contact options
- **Memory Wall**: Upload and organize photos, videos, and audio recordings with tagging
- **Journal**: Text and voice-to-text journal entries for daily thoughts and memories
- **Location Tracking**: Record important places and location history
- **Memory Games**: Daily personalized quizzes based on your contacts and memories
- **Routines & Tasks**: Structured daily routines with checkable tasks
- **Emergency Alerts**: One-touch emergency notifications to caregivers and family
- **Photo Identification**: Camera capture and tagging for identifying people and objects

### Accessibility Features
- Large, high-contrast interface designed for seniors
- Voice-to-text functionality using Web Speech API
- Simple navigation with clear, accessible buttons
- Real-time notifications for reminders and alerts

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Wouter for routing
- TanStack Query for data fetching
- Socket.io for real-time notifications

### Backend
- Express.js with TypeScript
- SQLite database with Drizzle ORM
- Express session-based authentication
- Socket.io for real-time features
- Multer for file uploads
- Node-cron for scheduled reminders

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or pnpm package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd memocare
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

4. **Initialize the database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser to `http://localhost:5000`
   - Demo login: `demo@memocare.local` / `demo123`

## Project Structure

