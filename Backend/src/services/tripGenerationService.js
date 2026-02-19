/**
 * Trip Generation Service
 * Orchestrates trip generation using OpenAI and Google Places APIs
 */

import { generateTripIterationsWithAI } from './openaiService.js';
import { batchEnrichActivities } from './placesService.js';

/**
 * Main function to generate trip iterations
 * Uses OpenAI for generation and Google Places for enrichment
 */
export const generateTripIterations = async ({
  destination,
  start_date,
  end_date,
  duration_days,
  tripType,
  guests,
  budget,
  description
}) => {
  try {
    console.log('🚀 Starting trip generation for:', destination.name);

    // Step 1: Generate trip iterations using OpenAI
    console.log('📝 Generating trip options with AI...');
    const aiGeneratedIterations = await generateTripIterationsWithAI({
      destination,
      start_date,
      end_date,
      duration_days,
      tripType,
      guests,
      budget,
      description
    });

    console.log(`✅ Generated ${aiGeneratedIterations.length} trip iterations`);

    // Step 2: Enrich each iteration with Google Places data
    console.log('📍 Enriching activities with location data...');
    const enrichedIterations = await enrichIterationsWithPlaces(
      aiGeneratedIterations,
      destination
    );

    console.log('✨ Trip generation complete!');
    return enrichedIterations;

  } catch (error) {
    console.error('❌ Error in trip generation:', error);

    // Fallback to mock data if AI fails
    console.log('⚠️ Falling back to mock data generation...');
    return generateFallbackIterations({
      destination,
      start_date,
      end_date,
      duration_days,
      tripType,
      guests,
      budget,
      description
    });
  }
};

/**
 * Enrich all iterations with Google Places data
 */
const enrichIterationsWithPlaces = async (iterations, destination) => {
  const enrichedIterations = [];

  for (const iteration of iterations) {
    try {
      console.log(`  Processing: ${iteration.title}...`);

      const enrichedItinerary = [];

      for (const day of iteration.itinerary) {
        // Enrich all activities for this day
        const enrichedActivities = await batchEnrichActivities(
          day.activities,
          destination
        );

        // Recalculate day total cost
        const dayTotalCost = enrichedActivities.reduce(
          (sum, activity) => sum + (activity.cost || 0),
          0
        );

        enrichedItinerary.push({
          ...day,
          activities: enrichedActivities,
          total_cost: dayTotalCost
        });
      }

      // Recalculate iteration total cost
      const totalCost = enrichedItinerary.reduce(
        (sum, day) => sum + day.total_cost,
        0
      );

      enrichedIterations.push({
        ...iteration,
        itinerary: enrichedItinerary,
        total_cost: Math.round(totalCost)
      });

      console.log(`  ✓ ${iteration.title}: $${Math.round(totalCost)}`);

    } catch (error) {
      console.error(`Error enriching iteration "${iteration.title}":`, error.message);
      // Keep original iteration if enrichment fails
      enrichedIterations.push(iteration);
    }
  }

  return enrichedIterations;
};

/**
 * Fallback mock data generator when AI fails
 */
const generateFallbackIterations = ({
  destination,
  start_date,
  end_date,
  duration_days,
  tripType,
  guests,
  budget,
  description
}) => {
  const budgetMultiplier = {
    budget: 0.7,
    moderate: 1.0,
    luxury: 1.8,
    premium: 2.5
  };

  const baseCostPerDay = 150 * guests.total;
  const costPerDay = baseCostPerDay * budgetMultiplier[budget];

  const iterationStyles = [
    {
      style: 'Balanced Explorer',
      pace: 'moderate',
      description: 'Perfect mix of must-see attractions and hidden gems with comfortable pacing',
      highlights: [
        { icon: 'clock', label: 'Pace', value: 'Moderate' },
        { icon: 'star', label: 'Highlights', value: `${Math.ceil(duration_days * 3)} Activities` },
        { icon: 'heart', label: 'Style', value: 'Balanced' },
        { icon: 'users', label: 'Best For', value: tripType }
      ]
    },
    {
      style: 'Relaxed Journey',
      pace: 'relaxed',
      description: 'Leisurely exploration with plenty of downtime and spontaneity',
      highlights: [
        { icon: 'clock', label: 'Pace', value: 'Relaxed' },
        { icon: 'star', label: 'Highlights', value: `${Math.ceil(duration_days * 2)} Activities` },
        { icon: 'heart', label: 'Style', value: 'Laid-back' },
        { icon: 'coffee', label: 'Focus', value: 'Local Experience' }
      ]
    },
    {
      style: 'Action-Packed Adventure',
      pace: 'fast',
      description: 'Maximum experiences packed into every day for adventure seekers',
      highlights: [
        { icon: 'clock', label: 'Pace', value: 'Fast-paced' },
        { icon: 'star', label: 'Highlights', value: `${Math.ceil(duration_days * 4)} Activities` },
        { icon: 'heart', label: 'Style', value: 'Adventure' },
        { icon: 'bolt', label: 'Energy', value: 'High' }
      ]
    }
  ];

  const iterations = iterationStyles.map((style, index) => {
    const activitiesPerDay = style.pace === 'relaxed' ? 2 : style.pace === 'moderate' ? 3 : 4;
    const iteration_id = `iter_${Date.now()}_${index}`;

    const itinerary = [];
    const startDate = new Date(start_date);

    for (let day = 0; day < duration_days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      const activities = generateActivitiesForDay(
        destination.name,
        day + 1,
        activitiesPerDay,
        budget,
        tripType
      );

      const dayTotalCost = activities.reduce((sum, act) => sum + (act.cost || 0), 0);

      itinerary.push({
        day_number: day + 1,
        date: currentDate.toISOString().split('T')[0],
        title: `Day ${day + 1}: ${activities[0]?.title || 'Explore ' + destination.name}`,
        summary: `${activitiesPerDay} activities planned for day ${day + 1}`,
        activities,
        total_cost: dayTotalCost
      });
    }

    const totalCost = itinerary.reduce((sum, day) => sum + day.total_cost, 0);

    return {
      iteration_id,
      title: style.style,
      description: style.description,
      highlights: style.highlights,
      itinerary,
      total_cost: Math.round(totalCost),
      total_days: duration_days,
      pace: style.pace,
      style: style.style,
      selected: index === 0
    };
  });

  return iterations;
};

/**
 * Helper to generate mock activities
 */
const generateActivitiesForDay = (destinationName, dayNumber, count, budget, tripType) => {
  const activityTemplates = [
    {
      category: 'sightseeing',
      templates: [
        { title: `Visit ${destinationName} Historic Center`, description: 'Explore the charming historic district with guided tour', duration: '3 hours', placeQuery: `${destinationName} Historic Center` },
        { title: 'City Highlights Walking Tour', description: 'Discover major landmarks and hidden gems with local guide', duration: '2.5 hours', placeQuery: `${destinationName} Walking Tour` },
        { title: 'Museum and Art Gallery Visit', description: 'Immerse in local culture and history', duration: '2 hours', placeQuery: `${destinationName} Museum` },
        { title: 'Panoramic Viewpoint Tour', description: 'Capture stunning city views from the best vantage points', duration: '1.5 hours', placeQuery: `${destinationName} Viewpoint` }
      ]
    },
    {
      category: 'dining',
      templates: [
        { title: 'Authentic Local Cuisine Lunch', description: 'Savor traditional dishes at a highly-rated restaurant', duration: '1.5 hours', placeQuery: `${destinationName} Restaurant` },
        { title: 'Fine Dining Experience', description: 'Enjoy a memorable culinary experience', duration: '2 hours', placeQuery: `${destinationName} Fine Dining` },
        { title: 'Street Food Tour', description: 'Taste the best local street food specialties', duration: '2 hours', placeQuery: `${destinationName} Street Food` },
        { title: 'Waterfront Dinner', description: 'Dine with scenic views and fresh local ingredients', duration: '2 hours', placeQuery: `${destinationName} Waterfront Restaurant` }
      ]
    },
    {
      category: 'adventure',
      templates: [
        { title: 'Outdoor Adventure Activity', description: 'Exciting outdoor experience in nature', duration: '4 hours', placeQuery: `${destinationName} Adventure` },
        { title: 'Water Sports & Beach Time', description: 'Enjoy beach activities and water sports', duration: '3 hours', placeQuery: `${destinationName} Beach` },
        { title: 'Hiking & Nature Trail', description: 'Explore scenic trails and natural beauty', duration: '3.5 hours', placeQuery: `${destinationName} Hiking Trail` },
        { title: 'Bike Tour', description: 'Cycle through the city and surrounding areas', duration: '3 hours', placeQuery: `${destinationName} Bike Tour` }
      ]
    }
  ];

  const budgetCostMap = {
    budget: { min: 20, max: 50 },
    moderate: { min: 50, max: 120 },
    luxury: { min: 120, max: 250 },
    premium: { min: 250, max: 500 }
  };

  const times = ['09:00 AM', '12:00 PM', '03:00 PM', '06:00 PM', '07:30 PM'];
  const activities = [];

  for (let i = 0; i < count; i++) {
    const categoryIndex = i % activityTemplates.length;
    const category = activityTemplates[categoryIndex];
    const template = category.templates[Math.floor(Math.random() * category.templates.length)];

    const costRange = budgetCostMap[budget];
    const cost = Math.floor(Math.random() * (costRange.max - costRange.min) + costRange.min);

    activities.push({
      time: times[i] || '10:00 AM',
      title: template.title,
      description: template.description,
      location: {
        name: destinationName,
        coordinates: { lat: 0, lng: 0 }
      },
      duration: template.duration,
      cost,
      category: category.category,
      placeQuery: template.placeQuery,
      image: `https://images.unsplash.com/photo-${1500000000000 + dayNumber * 1000 + i}?w=400&h=300&fit=crop`,
      rating: 4.0 + Math.random() * 1.0 // 4.0 to 5.0
    });
  }

  return activities;
};

export default {
  generateTripIterations
};
