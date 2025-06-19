const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  busType: {
    type: String,
    required: [true, 'Bus type is required'],
    enum: ['AC', 'Non-AC', 'Express', 'Local', 'Premium']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [100, 'Capacity cannot exceed 100']
  },
  currentCapacity: {
    type: Number,
    default: 0,
    min: 0
  },
  model: {
    type: String,
    required: [true, 'Bus model is required']
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required']
  },
  yearOfManufacture: {
    type: Number,
    required: [true, 'Year of manufacture is required'],
    min: [1990, 'Year must be 1990 or later'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['Diesel', 'Petrol', 'Electric', 'Hybrid', 'CNG']
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'on_trip'],
    default: 'inactive'
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  currentRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  speed: {
    type: Number,
    default: 0,
    min: 0,
    max: 120
  },
  direction: {
    type: Number,
    min: 0,
    max: 360,
    default: 0
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastLocationUpdate: {
    type: Date,
    default: Date.now
  },
  maintenanceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    description: String,
    cost: Number,
    mileage: Number
  }],
  totalMileage: {
    type: Number,
    default: 0,
    min: 0
  },
  fuelLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  temperature: {
    type: Number,
    default: 25
  },
  amenities: [{
    type: String,
    enum: ['WiFi', 'USB_Charging', 'Air_Conditioning', 'Wheelchair_Access', 'TV', 'GPS']
  }],
  images: [{
    url: String,
    publicId: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
busSchema.index({ currentLocation: '2dsphere' });
busSchema.index({ busNumber: 1 });
busSchema.index({ registrationNumber: 1 });
busSchema.index({ status: 1 });

// Virtual for available seats
busSchema.virtual('availableSeats').get(function() {
  return this.capacity - this.currentCapacity;
});

// Method to update location
busSchema.methods.updateLocation = function(lat, lng, address) {
  this.currentLocation.coordinates = [lng, lat]; // MongoDB uses [longitude, latitude]
  this.currentLocation.address = address;
  this.currentLocation.lastUpdated = new Date();
  this.lastLocationUpdate = new Date();
  return this.save();
};

// Method to start trip
busSchema.methods.startTrip = function(routeId, driverId) {
  this.status = 'on_trip';
  this.currentRoute = routeId;
  this.currentDriver = driverId;
  this.isOnline = true;
  return this.save();
};

// Method to end trip
busSchema.methods.endTrip = function() {
  this.status = 'active';
  this.currentRoute = null;
  this.currentDriver = null;
  this.isOnline = false;
  this.currentCapacity = 0;
  return this.save();
};

module.exports = mongoose.model('Bus', busSchema); 