const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus ID is required']
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route ID is required']
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: [true, 'Driver ID is required']
  },
  stopId: {
    type: Number,
    required: [true, 'Stop ID is required']
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Current location coordinates are required']
    }
  },
  predictedArrivalTime: {
    type: Date,
    required: [true, 'Predicted arrival time is required']
  },
  actualArrivalTime: {
    type: Date
  },
  predictionAccuracy: {
    type: Number,
    min: 0,
    max: 100
  },
  factors: {
    trafficConditions: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    weatherConditions: {
      type: String,
      enum: ['clear', 'rainy', 'snowy', 'foggy'],
      default: 'clear'
    },
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: 'morning'
    },
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: 'monday'
    },
    currentSpeed: {
      type: Number,
      default: 0,
      min: 0,
      max: 120
    },
    distanceToStop: {
      type: Number,
      required: [true, 'Distance to stop is required'],
      min: 0
    },
    numberOfStops: {
      type: Number,
      default: 0,
      min: 0
    },
    passengerLoad: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    fuelLevel: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    temperature: {
      type: Number,
      default: 25
    }
  },
  historicalData: {
    averageTravelTime: {
      type: Number,
      default: 0
    },
    standardDeviation: {
      type: Number,
      default: 0
    },
    confidenceInterval: {
      lower: {
        type: Number,
        default: 0
      },
      upper: {
        type: Number,
        default: 0
      }
    }
  },
  algorithm: {
    type: String,
    enum: ['linear_regression', 'random_forest', 'neural_network', 'ensemble'],
    default: 'linear_regression'
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  status: {
    type: String,
    enum: ['pending', 'in_transit', 'arrived', 'cancelled'],
    default: 'pending'
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

// Index for efficient queries
predictionSchema.index({ busId: 1, routeId: 1, stopId: 1 });
predictionSchema.index({ predictedArrivalTime: 1 });
predictionSchema.index({ status: 1 });
predictionSchema.index({ createdAt: 1 });

// Method to calculate prediction accuracy
predictionSchema.methods.calculateAccuracy = function() {
  if (!this.actualArrivalTime) return null;
  
  const predicted = new Date(this.predictedArrivalTime);
  const actual = new Date(this.actualArrivalTime);
  const difference = Math.abs(predicted - actual) / (1000 * 60); // difference in minutes
  
  // Calculate accuracy percentage (100% if exact, decreasing with difference)
  const accuracy = Math.max(0, 100 - (difference * 2)); // 2% penalty per minute
  this.predictionAccuracy = Math.round(accuracy);
  
  return this.predictionAccuracy;
};

// Method to update prediction based on new factors
predictionSchema.methods.updatePrediction = function(newFactors) {
  this.factors = { ...this.factors, ...newFactors };
  this.updatedAt = new Date();
  
  // Simple prediction algorithm (can be enhanced with ML models)
  let baseTime = this.historicalData.averageTravelTime || 30; // default 30 minutes
  
  // Adjust based on traffic conditions
  if (this.factors.trafficConditions === 'high') baseTime *= 1.5;
  else if (this.factors.trafficConditions === 'low') baseTime *= 0.8;
  
  // Adjust based on weather
  if (this.factors.weatherConditions === 'rainy' || this.factors.weatherConditions === 'snowy') {
    baseTime *= 1.3;
  }
  
  // Adjust based on time of day
  if (this.factors.timeOfDay === 'morning' || this.factors.timeOfDay === 'evening') {
    baseTime *= 1.2; // peak hours
  }
  
  // Adjust based on current speed
  if (this.factors.currentSpeed > 0) {
    const speedFactor = 30 / this.factors.currentSpeed; // 30 km/h is baseline
    baseTime *= speedFactor;
  }
  
  // Calculate new predicted arrival time
  const now = new Date();
  const newArrivalTime = new Date(now.getTime() + (baseTime * 60 * 1000));
  this.predictedArrivalTime = newArrivalTime;
  
  return this.save();
};

// Static method to get predictions for a specific stop
predictionSchema.statics.getPredictionsForStop = function(stopId, routeId) {
  return this.find({
    stopId,
    routeId,
    status: { $in: ['pending', 'in_transit'] },
    predictedArrivalTime: { $gte: new Date() }
  })
  .populate('busId', 'busNumber busType capacity currentCapacity')
  .populate('driverId', 'firstName lastName')
  .sort({ predictedArrivalTime: 1 })
  .limit(10);
};

// Static method to get historical accuracy
predictionSchema.statics.getHistoricalAccuracy = function(busId, routeId, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        busId: mongoose.Types.ObjectId(busId),
        routeId: mongoose.Types.ObjectId(routeId),
        actualArrivalTime: { $exists: true, $ne: null },
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: null,
        averageAccuracy: { $avg: '$predictionAccuracy' },
        totalPredictions: { $sum: 1 },
        accuratePredictions: {
          $sum: {
            $cond: [{ $gte: ['$predictionAccuracy', 80] }, 1, 0]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Prediction', predictionSchema); 