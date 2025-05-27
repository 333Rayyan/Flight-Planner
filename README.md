# Flight Planner

A comprehensive web application for searching, viewing, and managing flight bookings with user authentication and personalized bookmarking features.

## Features

### 🔐 User Authentication
- **User Registration**: Create new accounts with secure password validation
  - Email validation
  - Username uniqueness checking
  - Strong password requirements (uppercase, lowercase, numbers, special characters)
  - Password confirmation matching
- **User Login**: Secure login with session management
- **Password Management**: Change passwords with current password verification
- **Account Management**: Delete user accounts with confirmation

### ✈️ Flight Search & Discovery
- **Advanced Flight Search**: Search flights with multiple parameters
  - Origin and destination selection from 45+ global cities
  - Departure and return date selection
  - Passenger count (adults and children)
  - Maximum price filtering
  - Real-time flight data via Amadeus API
- **Popular Destinations**: Quick access to trending destinations
  - Paris, Rome, Dubai, New York, Istanbul, Tokyo
  - Visual destination cards with hover effects
- **Flight Details**: Comprehensive flight information
  - Departure/arrival times and dates
  - Flight duration calculations
  - Carrier and aircraft information
  - Pricing in GBP
  - Number of stops/connections

### 📚 Bookmark Management
- **Save Flights**: Bookmark favorite flight offers for later reference
- **My Bookmarks**: Personal dashboard for saved flights
- **Search Bookmarks**: Filter saved flights by location
- **Remove Bookmarks**: Delete unwanted bookmarks with confirmation
- **Bookmark Details**: View comprehensive flight information in modal popups

### 🎨 User Interface
- **Responsive Design**: Mobile-friendly Bootstrap-based interface
- **Interactive Elements**: 
  - Collapsible flight details
  - Hover effects on destination cards
  - Password visibility toggles
  - Modal confirmations
- **Navigation**: 
  - User-specific navigation (logged in vs guest)
  - Dropdown menus for user actions
  - Breadcrumb navigation

### 📱 Pages & Views
- **Home Page**: Landing page with popular destinations
- **Search Page**: Flight search interface with validation
- **Flight Results**: Display search results with booking options
- **Login/Register**: Authentication forms with validation
- **Profile Management**: User account settings and password changes
- **Bookmarks**: Personal flight collection management
- **About Page**: Application information and contact details
- **404 Error**: Custom error page for invalid routes

### 🔒 Security Features
- **Session Management**: Secure user sessions with Express Session
- **Password Hashing**: Bcrypt encryption for password security
- **Input Validation**: Server-side validation using Express Validator
- **CSRF Protection**: Form validation and sanitization
- **Authentication Guards**: Protected routes requiring login

### 🗄️ Database Features
- **MySQL Integration**: Persistent data storage
- **Stored Procedures**: Optimized database operations
  - `AddBookmark`: Add new flight bookmarks
  - `GetBookmarksByUser`: Retrieve user's bookmarks
  - `DeleteBookmark`: Remove bookmarks
- **User Management**: Secure user data handling
- **Relational Data**: Foreign key relationships between users and bookmarks

### 🌐 API Integration
- **Amadeus Flight API**: Real-time flight data
- **RESTful Endpoints**: Internal API for bookmark management
- **Error Handling**: Graceful API failure management
- **Data Transformation**: Flight data processing and formatting

### 📊 Data Management
- **Flight Data**: Comprehensive flight information storage
- **User Preferences**: Personal settings and search history
- **Search Filters**: Advanced filtering capabilities
- **Data Validation**: Client and server-side input validation

### 🎯 User Experience
- **Intuitive Navigation**: Easy-to-use interface design
- **Visual Feedback**: Loading states and success/error messages
- **Search Persistence**: Maintain search parameters across pages
- **Quick Actions**: One-click bookmarking and removal
- **Responsive Layout**: Optimized for all device sizes

## Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: EJS templating with Bootstrap 5
- **Database**: MySQL with stored procedures
- **Authentication**: bcrypt for password hashing
- **API**: Amadeus Flight Offers API
- **Session Management**: Express Session
- **Validation**: Express Validator

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up MySQL database using `setup.sql`
4. Configure environment variables in `.env`
5. Start the application: `npm start`
6. Access at `http://localhost:8000`

## Database Schema

- **users**: User account information
- **bookmarks**: Saved flight preferences
- **Stored Procedures**: Optimized database operations

The application provides a complete flight planning solution with modern web technologies and secure user management.
