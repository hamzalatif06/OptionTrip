import mongoose from 'mongoose';

// Activity schema for detailed itinerary (Phase 2 only)
const activitySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  place_name: {
    type: String,
    required: true
  },
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  duration: String,
  cost: Number,
  category: {
    type: String,
    enum: ['sightseeing', 'dining', 'adventure', 'relaxation', 'culture', 'shopping', 'transport', 'nature', 'entertainment', 'nightlife', 'beach', 'museum', 'historical', 'outdoor', 'wellness', 'sports', 'photography', 'other'],
    default: 'sightseeing'
  },
  image: String,
  rating: Number,
  address: String,
  place_id: String
});

// Day itinerary schema for Phase 2
const dayItinerarySchema = new mongoose.Schema({
  day_number: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  summary: String,
  activities: [activitySchema],
  total_cost: {
    type: Number,
    default: 0
  }
});

// Trip Option schema (Phase 1 - lightweight)
const tripOptionSchema = new mongoose.Schema({
  option_id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  pace: {
    type: String,
    enum: ['slow', 'moderate', 'fast'],
    required: true
  },
  style: {
    type: String,
    required: true
  },
  total_days: {
    type: Number,
    required: true
  },
  estimated_total_cost: {
    type: Number,
    required: true
  },
  ideal_for: {
    type: String,
    required: true
  },
  highlights: [{
    icon: String,
    label: String,
    value: String
  }],
  // Phase 2 data (populated only after user selects this option)
  itinerary: [dayItinerarySchema],
  itinerary_generated: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Main Trip schema
const tripSchema = new mongoose.Schema({
  trip_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    index: true
  },
  destination: {
    text: {
      type: String,
      required: true
    },
    place_id: String,
    name: {
      type: String,
      required: true
    },
    geometry: {
      lat: Number,
      lng: Number
    }
  },
  dates: {
    start_date: {
      type: String,
      required: true
    },
    end_date: {
      type: String,
      required: true
    },
    duration_days: {
      type: Number,
      required: true
    },
    month_year: String
  },
  trip_type: {
    type: String,
    required: true
  },
  guests: {
    total: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    adults: {
      type: Number,
      default: 1
    },
    children: {
      type: Number,
      default: 0
    },
    infants: {
      type: Number,
      default: 0
    },
    label: String
  },
  budget: {
    type: String,
    enum: ['budget', 'moderate', 'luxury', 'premium'],
    required: true
  },
  description: String,

  // Phase 1: Trip options (lightweight)
  options: [tripOptionSchema],
  options_generated: {
    type: Boolean,
    default: false
  },

  // Selected option
  selected_option_id: String,

  // Trip status
  status: {
    type: String,
    enum: ['draft', 'options_generated', 'option_selected', 'itinerary_generated', 'confirmed', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Index for faster queries
tripSchema.index({ user_id: 1, createdAt: -1 });

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
