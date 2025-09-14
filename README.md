# FestivoEMS - Event Management System

A comprehensive full-stack web application for managing college fest events with QR code verification, role-based access control, and real-time attendance tracking.

## Features

### 🎯 Core Functionality
- **User Authentication**: JWT-based authentication with role-based access control
- **Event Management**: Create, update, and manage events with packages and pricing
- **Registration System**: Individual and group event registration with QR code generation
- **QR Code Verification**: Real-time participant verification and attendance marking
- **Committee Dashboard**: Dedicated interface for event committees
- **Admin Dashboard**: Comprehensive admin panel with statistics and exports

### 👥 User Roles
- **Students**: Register for events, view registrations, download QR codes
- **Committee Members**: Verify participants, mark attendance, view assigned events
- **Admins**: Manage events, committees, users, and view system statistics

### 🛠️ Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **QR Codes**: qrcode npm package
- **UI Components**: Lucide React icons

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd festivo-ems
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cd backend
   cp config.env.example config.env
   # Edit config.env with your MongoDB URI and JWT secret
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   # Default connection: mongodb://localhost:27017/festivo-ems
   ```

5. **Seed the database**
   ```bash
   cd backend
   npm run seed
   ```

6. **Start the application**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

### Demo Accounts

After seeding the database, you can use these accounts:

**Admin Account:**
- Email: admin@festivo.com
- Password: admin123

**Committee Account:**
- Email: committee@festivo.com
- Password: committee123

**Student Accounts:**
- Email: john@student.com
- Password: student123
- Email: jane@student.com
- Password: student123
- Email: mike@student.com
- Password: student123

## Project Structure

```
festivo-ems/
├── backend/
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── middleware/       # Authentication middleware
│   ├── server.js         # Express server
│   ├── seed.js          # Database seeding
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── contexts/     # React contexts
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main app component
│   └── package.json
└── package.json          # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (Admin only)
- `PUT /api/events/:id` - Update event (Admin only)
- `DELETE /api/events/:id` - Delete event (Admin only)

### Registrations
- `POST /api/registrations/events/:id/register` - Register for event
- `GET /api/registrations/users/:id/registrations` - Get user registrations
- `GET /api/registrations/events/:id/registrations` - Get event registrations

### Verification
- `POST /api/verify/verify` - Verify QR code
- `POST /api/verify/attendance` - Mark attendance
- `GET /api/verify/attendance/:id` - Get attendance records

### Scores
- `POST /api/scores` - Submit score
- `GET /api/scores/event/:id` - Get event scores
- `GET /api/scores/registration/:id` - Get registration scores

### Committee
- `GET /api/committee/:id/dashboard` - Get committee dashboard
- `GET /api/committee` - Get all committees (Admin only)
- `POST /api/committee` - Create committee (Admin only)

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/export/participants` - Export participants CSV
- `GET /api/admin/export/attendance` - Export attendance CSV

## Key Features Explained

### QR Code System
- Each registration generates a unique QR code using UUID
- QR codes contain registration data for verification
- Committee members can scan QR codes to verify participants
- QR codes are displayed as images and can be downloaded

### Group Registration
- Events can be configured as individual or group events
- Group leaders can add members during registration
- All group members are linked to the same registration
- Attendance can be marked for individual group members

### Role-Based Access Control
- **Students**: Can register for events and view their registrations
- **Committee Members**: Can verify participants and mark attendance for assigned events
- **Admins**: Have full access to all features and can manage the system

### Event Packages
- Events can have multiple pricing packages
- Packages can include student discounts or bulk pricing
- Users can select packages during registration

## Development

### Running in Development Mode
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server  # Backend only
npm run client  # Frontend only
```

### Database Seeding
The seed script creates:
- 1 Admin user
- 1 Committee user
- 5 Student users
- 1 Committee
- 3 Sample events

### Environment Variables
Create a `backend/config.env` file with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/festivo-ems
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
