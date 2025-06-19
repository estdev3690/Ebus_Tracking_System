const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stop name is required'],
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Stop coordinates are required']
    },
    address: String
  },
  stopNumber: {
    type: Number,
    required: [true, 'Stop number is required'],
    min: 1
  },
  estimatedTime: {
    type: Number, // in minutes from route start
    required: [true, 'Estimated time is required'],
    min: 0
  },
  isTerminal: {
    type: Boolean,
    default: false
  },
  facilities: [{
    type: String,
    enum: ['Shelter', 'Seating', 'Lighting', 'Display_Board', 'Ticket_Counter', 'Restroom']
  }]
});

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: [true, 'Route number is required'],
    unique: true,
    trim: true
  },
  routeName: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  stops: [stopSchema],
  totalDistance: {
    type: Number,
    required: [true, 'Total distance is required'],
    min: 0
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: [true, 'Estimated duration is required'],
    min: 1
  },
  fare: {
    base: {
      type: Number,
      required: [true, 'Base fare is required'],
      min: 0
    },
    perKm: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  operatingHours: {
    start: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    end: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    }
  },
  frequency: {
    type: Number, // minutes between buses
    required: [true, 'Frequency is required'],
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  routeType: {
    type: String,
    enum: ['local', 'express', 'premium', 'airport', 'intercity'],
    default: 'local'
  },
  assignedBuses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }],
  assignedDrivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    frequency: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  averageSpeed: {
    type: Number,
    default: 30, // km/h
    min: 1,
    max: 100
  },
  trafficConditions: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
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
routeSchema.index({ 'stops.location': '2dsphere' });
routeSchema.index({ status: 1 });

// Method to calculate fare between two stops
routeSchema.methods.calculateFare = function(fromStopNumber, toStopNumber) {
  const fromStop = this.stops.find(stop => stop.stopNumber === fromStopNumber);
  const toStop = this.stops.find(stop => stop.stopNumber === toStopNumber);
  
  if (!fromStop || !toStop) {
    throw new Error('Invalid stop numbers');
  }
  
  const distance = Math.abs(toStop.estimatedTime - fromStop.estimatedTime) * (this.averageSpeed / 60);
  return this.fare.base + (distance * this.fare.perKm);
};

// Method to get next bus arrival time
routeSchema.methods.getNextBusTime = function(currentTime, frequency) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Find the next bus time based on frequency
  const nextBusMinutes = Math.ceil(currentMinutes / frequency) * frequency;
  const nextBusTime = new Date();
  nextBusTime.setHours(Math.floor(nextBusMinutes / 60), nextBusMinutes % 60, 0, 0);
  
  return nextBusTime;
};

// Method to check if route is operating now
routeSchema.methods.isOperatingNow = function() {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' });
  
  const todaySchedule = this.schedule.find(s => s.day === dayOfWeek);
  if (!todaySchedule) return false;
  
  const startMinutes = parseInt(todaySchedule.startTime.split(':')[0]) * 60 + 
                      parseInt(todaySchedule.startTime.split(':')[1]);
  const endMinutes = parseInt(todaySchedule.endTime.split(':')[0]) * 60 + 
                    parseInt(todaySchedule.endTime.split(':')[1]);
  
  return currentTime >= startMinutes && currentTime <= endMinutes;
};

module.exports = mongoose.model('Route', routeSchema); 