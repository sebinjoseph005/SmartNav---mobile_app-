import { MapsAPIService } from "../external/MapsAPI.service";

export class ItineraryService {
  static async generateTrip(input: {
    destination: string;
    lat: number;
    lon: number;
    days: number;
    budget: number;
    currency: string;
    interests: string[];
  }) {
    try {
      // Validate and default days if null/undefined
      const days = input.days || 4; // Default to 4 days if not provided
      
      console.log('🗺️ Generating itinerary for:', input.destination);
      console.log('📍 Coordinates:', input.lat, input.lon);
      console.log('📅 Days:', days, input.days ? '' : '(defaulted from null)');
      console.log('💰 Budget:', input.budget, input.currency);
      console.log('🎯 Interests:', input.interests.join(', '));
      
      // Map interests to Foursquare categories
      const interestMap: Record<string, string> = {
        History: '10000,12000',      // Arts & Entertainment, Landmarks & Outdoors
        Food: '13000,13065',         // Dining & Drinking, Restaurants
        Nature: '16000,16032',       // Landmarks & Outdoors, Parks
        Adventure: '18000,19000',    // Sports & Recreation, Travel & Transportation
        Shopping: '17000,17069',     // Retail, Shopping Malls
        Relaxation: '16032,15000',   // Parks, Health & Medicine (spas)
      };

      const categoryIds = input.interests
        .map(interest => interestMap[interest])
        .filter(Boolean);
      
      const categories = categoryIds.join(',') || '10000';

      console.log('🔍 Fetching real places from Foursquare API...');
      console.log('📂 Categories:', categories);
      
      // Get real places from Foursquare
      const places = await MapsAPIService.getPlacesByCategory(
        input.lat,
        input.lon,
        categories
      );

      console.log(`✅ Found ${places.length} real places from Foursquare`);

      // Generate timeline from real places
      const timeline = this.generateTimelineFromPlaces(places, { ...input, days });

      return {
        destination: input.destination,
        days: days,
        budget: input.budget,
        currency: input.currency,
        interests: input.interests,
        timeline: timeline,
      };
    } catch (error: any) {
      console.error('❌ Error calling Foursquare API:', error.message);
      const days = input.days || 4;
      return this.generateFallbackItinerary({ ...input, days });
    }
  }

  private static generateTimelineFromPlaces(places: any[], input: any) {
    const activitiesPerDay = 4;
    const timeline = [];
    const budgetPerDay = input.budget / input.days;

    for (let dayNum = 1; dayNum <= input.days; dayNum++) {
      const activities = [];
      const times = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'];

      for (let i = 0; i < activitiesPerDay; i++) {
        const placeIndex = ((dayNum - 1) * activitiesPerDay + i) % places.length;
        const place = places[placeIndex] || {
          name: `Visit ${input.destination}`,
          description: 'Explore local attractions',
        };
        
        const cost = i === 1 ? Math.round(budgetPerDay * 0.3) : Math.round(budgetPerDay * 0.15);
        const duration = i === 1 ? '1.5h' : '2h';
        
        activities.push({
          time: times[i],
          title: place.name,
          subtitle: place.description,
          rating: '4.' + (5 + Math.floor(Math.random() * 4)),
          badge: i === 0 ? 'SafeZone' : i === 1 ? 'Popular' : 'Recommended',
          info: i === 3 ? `Free • ${duration}` : `₹${cost} • ${duration}`,
        });
      }

      timeline.push({
        day: dayNum,
        activities: activities,
      });
    }

    return timeline;
  }

  private static generateFallbackItinerary(input: any) {
    console.log('⚠️ Using enhanced fallback with destination-specific recommendations');
    
    // Destination-specific landmarks database
    const landmarksByDestination: Record<string, any[]> = {
      tokyo: [
        { name: 'Senso-ji Temple', description: 'Ancient Buddhist temple', interest: 'History' },
        { name: 'Tokyo Skytree', description: 'Broadcasting tower with views', interest: 'Adventure' },
        { name: 'Imperial Palace', description: 'Primary residence of Emperor', interest: 'History' },
        { name: 'Shibuya Crossing', description: 'Famous intersection', interest: 'Adventure' },
        { name: 'Meiji Shrine', description: 'Shinto shrine', interest: 'History' },
        { name: 'Tsukiji Outer Market', description: 'Fresh seafood market', interest: 'Food' },
        { name: 'Harajuku', description: 'Fashion shopping district', interest: 'Shopping' },
        { name: 'Ueno Park', description: 'Public park with museums', interest: 'Nature' },
        { name: 'Akihabara', description: 'Electronics district', interest: 'Shopping' },
        { name: 'Mount Takao', description: 'Hiking mountain', interest: 'Adventure' },
        { name: 'Shinjuku Gyoen', description: 'Large park and garden', interest: 'Relaxation' },
        { name: 'TeamLab Borderless', description: 'Digital art museum', interest: 'Adventure' },
      ],
      delhi: [
        { name: 'Qutub Minar', description: 'UNESCO World Heritage Site', interest: 'History' },
        { name: 'Red Fort', description: 'Historic Mughal fortress', interest: 'History' },
        { name: 'India Gate', description: 'War memorial monument', interest: 'History' },
        { name: 'Lotus Temple', description: 'Baháʼí House of Worship', interest: 'Relaxation' },
        { name: 'Chandni Chowk', description: 'Historic market', interest: 'Shopping' },
        { name: 'Humayun\'s Tomb', description: 'Mughal architecture', interest: 'History' },
        { name: 'Lodhi Gardens', description: 'City park with tombs', interest: 'Nature' },
        { name: 'Karim\'s Restaurant', description: 'Authentic Mughlai cuisine', interest: 'Food' },
      ],
      goa: [
        { name: 'Baga Beach', description: 'Popular beach destination', interest: 'Relaxation' },
        { name: 'Fort Aguada', description: '17th-century Portuguese fort', interest: 'History' },
        { name: 'Dudhsagar Falls', description: 'Four-tiered waterfall', interest: 'Nature' },
        { name: 'Anjuna Flea Market', description: 'Wednesday market', interest: 'Shopping' },
        { name: 'Scuba Diving', description: 'Underwater adventure', interest: 'Adventure' },
        { name: 'Spice Plantation Tour', description: 'Organic spice farms', interest: 'Nature' },
        { name: 'Beach Shacks', description: 'Fresh seafood dining', interest: 'Food' },
        { name: 'Butterfly Beach', description: 'Secluded peaceful beach', interest: 'Relaxation' },
      ],
      mumbai: [
        { name: 'Gateway of India', description: 'Iconic arch monument', interest: 'History' },
        { name: 'Marine Drive', description: 'Scenic coastal road', interest: 'Relaxation' },
        { name: 'Elephanta Caves', description: 'UNESCO World Heritage Site', interest: 'History' },
        { name: 'Colaba Causeway', description: 'Shopping street', interest: 'Shopping' },
        { name: 'Bandra-Worli Sea Link', description: 'Cable-stayed bridge', interest: 'Adventure' },
        { name: 'Sanjay Gandhi National Park', description: 'Wildlife sanctuary', interest: 'Nature' },
        { name: 'Leopold Cafe', description: 'Historic restaurant', interest: 'Food' },
        { name: 'Juhu Beach', description: 'Popular city beach', interest: 'Relaxation' },
      ],
      jaipur: [
        { name: 'Hawa Mahal', description: 'Palace of Winds', interest: 'History' },
        { name: 'Amber Fort', description: 'Hilltop fort palace', interest: 'History' },
        { name: 'City Palace', description: 'Royal residence', interest: 'History' },
        { name: 'Jantar Mantar', description: 'Astronomical observatory', interest: 'History' },
        { name: 'Johari Bazaar', description: 'Jewelry market', interest: 'Shopping' },
        { name: 'Nahargarh Fort', description: 'Tiger fort with views', interest: 'Adventure' },
        { name: 'Chokhi Dhani', description: 'Rajasthani village cuisine', interest: 'Food' },
        { name: 'Jal Mahal', description: 'Water palace', interest: 'Relaxation' },
      ],
      bangalore: [
        { name: 'Lalbagh Botanical Garden', description: 'Historic garden', interest: 'Nature' },
        { name: 'Bangalore Palace', description: 'Tudor-style palace', interest: 'History' },
        { name: 'Cubbon Park', description: 'Large city park', interest: 'Nature' },
        { name: 'Commercial Street', description: 'Shopping district', interest: 'Shopping' },
        { name: 'Nandi Hills', description: 'Hill station for trekking', interest: 'Adventure' },
        { name: 'Vidhana Soudha', description: 'Legislative building', interest: 'History' },
        { name: 'MTR Restaurant', description: 'Authentic South Indian', interest: 'Food' },
        { name: 'Ulsoor Lake', description: 'Peaceful lake', interest: 'Relaxation' },
      ],
    };

    // Find matching destination
    const destinationKey = Object.keys(landmarksByDestination).find(key => 
      input.destination.toLowerCase().includes(key)
    );

    let recommendedPlaces: any[] = [];

    if (destinationKey) {
      // Filter places by user's interests
      const allPlaces = landmarksByDestination[destinationKey];
      recommendedPlaces = allPlaces.filter(place => 
        input.interests.includes(place.interest)
      );

      // If not enough matching places, add other popular places
      if (recommendedPlaces.length < 8) {
        const remaining = allPlaces.filter(place => 
          !recommendedPlaces.includes(place)
        );
        recommendedPlaces = [...recommendedPlaces, ...remaining].slice(0, 12);
      }

      console.log(`✅ Found ${recommendedPlaces.length} destination-specific places for ${destinationKey}`);
    }

    // Fallback to generic activities if no specific destination
    if (recommendedPlaces.length === 0) {
      const interestActivities: Record<string, any[]> = {
        History: [
          { name: 'Historical Museum', description: 'Explore ancient artifacts' },
          { name: 'Heritage Walking Tour', description: 'Guided historical tour' },
          { name: 'Ancient Fort', description: 'Historic architecture' },
          { name: 'Cultural Monument', description: 'Local heritage site' },
        ],
        Food: [
          { name: 'Local Restaurant', description: 'Traditional cuisine' },
          { name: 'Street Food Tour', description: 'Authentic local flavors' },
          { name: 'Food Market', description: 'Fresh local produce' },
          { name: 'Cooking Experience', description: 'Learn local recipes' },
        ],
        Nature: [
          { name: 'City Park', description: 'Scenic walking trails' },
          { name: 'Botanical Garden', description: 'Beautiful flora' },
          { name: 'Lake View', description: 'Peaceful waterfront' },
          { name: 'Nature Trail', description: 'Wildlife spotting' },
        ],
        Adventure: [
          { name: 'Adventure Sports Center', description: 'Thrilling activities' },
          { name: 'Hiking Trail', description: 'Scenic mountain path' },
          { name: 'Water Sports', description: 'Exciting activities' },
          { name: 'Outdoor Adventure', description: 'Challenge yourself' },
        ],
        Shopping: [
          { name: 'Local Market', description: 'Unique souvenirs' },
          { name: 'Shopping District', description: 'Modern retail' },
          { name: 'Artisan Shops', description: 'Handcrafted items' },
          { name: 'Traditional Bazaar', description: 'Cultural marketplace' },
        ],
        Relaxation: [
          { name: 'Spa & Wellness', description: 'Rejuvenating treatments' },
          { name: 'Peaceful Garden', description: 'Tranquil atmosphere' },
          { name: 'Scenic Viewpoint', description: 'Beautiful vistas' },
          { name: 'Meditation Center', description: 'Inner peace' },
        ],
      };

      // Create places based on interests
      for (const interest of input.interests) {
        const activities = interestActivities[interest] || [];
        recommendedPlaces.push(...activities.map(a => ({
          name: `${a.name} - ${input.destination}`,
          description: a.description,
        })));
      }
    }

    // Generate activities from recommended places
    const activitiesPerDay = 4;
    const timeline = [];
    const budgetPerDay = input.budget / input.days;

    for (let dayNum = 1; dayNum <= input.days; dayNum++) {
      const activities = [];
      const times = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'];

      for (let i = 0; i < activitiesPerDay; i++) {
        const placeIndex = ((dayNum - 1) * activitiesPerDay + i) % recommendedPlaces.length;
        const place = recommendedPlaces[placeIndex] || {
          name: `Explore ${input.destination}`,
          description: 'Discover local attractions',
        };
        
        const cost = i === 1 ? Math.round(budgetPerDay * 0.3) : Math.round(budgetPerDay * 0.15);
        const duration = i === 1 ? '1.5h' : '2h';
        
        activities.push({
          time: times[i],
          title: place.name,
          subtitle: place.description,
          rating: '4.' + (5 + Math.floor(Math.random() * 4)),
          badge: i === 0 ? 'SafeZone' : i === 1 ? 'Popular' : 'Recommended',
          info: i === 3 ? `Free • ${duration}` : `₹${cost} • ${duration}`,
        });
      }

      timeline.push({
        day: dayNum,
        activities: activities,
      });
    }

    return {
      destination: input.destination,
      days: input.days,
      budget: input.budget,
      currency: input.currency,
      interests: input.interests,
      timeline: timeline,
    };
  }
}
