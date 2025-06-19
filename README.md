# E-Bus Management System

A comprehensive bus management system with real-time tracking, arrival time predictions, and multi-role access control built with React, Node.js, and MongoDB.

## Features

### 🚌 Core Features
- **Real-time Bus Tracking**: Live location updates with Socket.IO
- **Arrival Time Prediction**: ML-based prediction system using historical data
- **Multi-role Access**: Separate interfaces for Users, Drivers, and Admins
- **Route Management**: Complete route planning with stops and schedules
- **Bus Search**: Find buses by source and destination
- **Favorites System**: Save frequently used routes

### 👥 User Roles

#### **Users**
- Search for buses by location
- Track bus locations in real-time
- View route information and schedules
- Save favorite routes
- Get arrival time predictions

#### **Drivers**
- Update bus location and status
- Start/end trips
- Report issues
- View assigned routes
- Update passenger count

#### **Admins**
- Manage drivers and buses
- Create and modify routes
- View system analytics
- Monitor prediction accuracy
- User management

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form management
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time updates
- **Leaflet** for maps (planned)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ebus_Management_System
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGO_URI=''
   JWT_SECRET=''
   CLOUDINARY_CLOUD_NAME=''
   CLOUDINARY_API_KEY=''
   CLOUDINARY_SECRET_KEY=''
   NODE_ENV=''
   ```

4. **Database Setup**
   
   The system will automatically create the necessary collections when you first run the application.

5. **Run the Application**
   
   From the root directory:
   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev
   
   # Or run separately:
   # Backend only
   npm run server
   
   # Frontend only
   npm run client
   ```

   The application will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/update-profile` - Update user profile

### User Routes
- `GET /api/user/search-bus` - Search for buses
- `GET /api/user/bus-location/:busId` - Get bus location
- `POST /api/user/track-bus/:busId` - Start tracking bus
- `GET /api/user/routes` - Get all routes
- `GET /api/user/favorite-routes` - Get favorite routes

### Driver Routes
- `PUT /api/driver/update-location` - Update location
- `POST /api/driver/start-trip` - Start trip
- `POST /api/driver/end-trip` - End trip
- `GET /api/driver/current-trip` - Get current trip info

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/drivers` - Get all drivers
- `GET /api/admin/buses` - Get all buses
- `GET /api/admin/routes` - Get all routes

### Prediction Routes
- `POST /api/prediction/generate` - Generate arrival prediction
- `GET /api/prediction/stop/:stopId` - Get stop predictions
- `GET /api/prediction/analytics` - Get prediction analytics

## Database Schema

### User Model
- Basic user information (name, email, password)
- Role-based access control
- Favorite routes

### Driver Model
- Driver information and license details
- Current location and status
- Assigned routes and current bus

### Bus Model
- Bus details (number, type, capacity)
- Current location and status
- Real-time tracking data

### Route Model
- Route information with stops
- Schedule and operating hours
- Fare calculation

### Prediction Model
- Arrival time predictions
- Historical accuracy data
- Environmental factors

## Real-time Features

The system uses Socket.IO for real-time communication:

- **Bus Location Updates**: Drivers update location, users receive real-time updates
- **Trip Status Changes**: Real-time notifications for trip start/end
- **Prediction Updates**: Live arrival time adjustments

## Prediction Algorithm

The arrival time prediction system considers:

- **Traffic Conditions**: Low, Medium, High
- **Weather Conditions**: Clear, Rainy, Snowy, Foggy
- **Time of Day**: Morning, Afternoon, Evening, Night
- **Current Speed**: Real-time bus speed
- **Historical Data**: Past performance on the same route
- **Distance to Stop**: Current distance from destination

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@ebus-system.com or create an issue in the repository.

## Roadmap

- [ ] Mobile app development
- [ ] Advanced ML prediction models
- [ ] Integration with traffic APIs
- [ ] Payment system integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Weather API integration
- [ ] Push notifications 
