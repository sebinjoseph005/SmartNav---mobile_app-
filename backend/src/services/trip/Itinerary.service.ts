import { MapsAPIService } from "../external/MapsAPI.service";
import { OpenAIService } from "../ai/OpenAI.service";

function isValidCoordinate(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  if (lat === 0 && lon === 0) return false;
  return true;
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeInterests(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(v => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);
}

function uniqByName(places: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const p of places) {
    const key = String(p?.name || '').trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export class ItineraryService {
  static async generateTrip(input: {
    destination: string;
    lat: number;
    lon: number;
    fromDate: string;
    toDate: string;
    travelers: number;
    budget: number;
    currency: string;
    interests: string[];
  }) {
    try {
      const destination = normalizeString(input.destination);
      const lat = Number(input.lat);
      const lon = Number(input.lon);
      const fromDate = normalizeString(input.fromDate);
      const toDate = normalizeString(input.toDate);
      const travelers = Number.isFinite(Number(input.travelers)) ? Number(input.travelers) : 1;
      const budget = Number.isFinite(Number(input.budget)) ? Number(input.budget) : 0;
      const currency = normalizeString(input.currency) || '₹';
      const interests = normalizeInterests(input.interests);

      // ⚠️ CRITICAL VALIDATION: Reject empty destination
      if (!destination || destination.trim().length === 0) {
        console.error('❌ EMPTY DESTINATION RECEIVED!');
        console.error('   Raw input:', JSON.stringify(input.destination));
        throw new Error('Destination is required. Please enter a city or place name.');
      }

      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      const hasValidDates = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime());
      const days = hasValidDates
        ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 4;
      
      console.log("\n🚀 ========== GENERATING TRIP ==========");
      console.log("🗺️  Destination:", destination);
      console.log("📍 Coordinates:", lat, lon);
      console.log("📅 Days:", days);
      console.log("🎯 Interests:", interests.join(', ') || '(none)');

      const hasCoords = isValidCoordinate(lat, lon);

      let places: any[] = [];
      let placesSource = 'none';
      
      // STEP 1: Try Foursquare API first (works WORLDWIDE)
      console.log('\n🌍 ========== FOURSQUARE API CALL ==========');
      console.log('   Destination:', destination);
      console.log('   Has valid coords?', hasCoords);
      if (hasCoords) {
        console.log('   Coordinates:', lat, ',', lon);
      } else {
        console.log('   Will search by name:', destination);
      }
      console.log('   User interests:', interests.join(', ') || 'None (will use defaults)');
      console.log('   FOURSQUARE_API_KEY exists:', !!process.env.FOURSQUARE_API_KEY);
      console.log('   FOURSQUARE_API_KEY length:', process.env.FOURSQUARE_API_KEY?.length || 0);
      
      try {
        const foursquarePlaces = await this.getNearbyPlaces({
          destination,
          lat,
          lon,
          interests,
        });
        
        console.log('\n📊 Foursquare API Results:');
        console.log('   Total places returned:', foursquarePlaces?.length || 0);
        
        if (foursquarePlaces && foursquarePlaces.length > 0) {
          places = foursquarePlaces;
          placesSource = 'foursquare';
          console.log('   ✅ SUCCESS - Got real places from Foursquare');
          console.log('   Sample places:');
          foursquarePlaces.slice(0, 5).forEach((p, i) => {
            console.log(`      ${i+1}. ${p.name} (${p.interest}) - Rating: ${p.rating}`);
          });
        } else {
          console.error('   ❌ FOURSQUARE RETURNED 0 PLACES!');
          console.error('   Destination:', destination);
          console.error('   This means either:');
          console.error('      - Destination name is invalid');
          console.error('      - Foursquare has no data for this location');
          console.error('      - API request failed silently');
        }
      } catch (error: any) {
        console.error('\n❌ FOURSQUARE API COMPLETELY FAILED:');
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        console.error('   This likely means:');
        console.error('      - API key is invalid or missing');
        console.error('      - Network connection issue');
        console.error('      - Foursquare service is down');
      }
      console.log('========================================\n');
      
      // Remove mock data - use only Foursquare or AI
      console.log(`📍 Final source: ${placesSource}`);

      places = uniqByName(places);
      console.log(`📊 Total unique places: ${places.length}`);

      if (places.length === 0) {
        console.warn('\n⚠️ WARNING: No places found from specific interest categories!');
        console.warn('   Destination:', destination);
        console.warn('   Interests:', interests.join(', '));
        console.warn('   Attempting MULTI-LEVEL FALLBACK SEARCH...\n');
        
        // FALLBACK LEVEL 1: Try broader tourist categories
        const fallbackAttempts = [
          { name: 'Tourist attractions', categories: 'museum,attraction,park,monument,temple,gallery' },
          { name: 'Any tourism/historic', categories: 'attraction,monument,park' },
          { name: 'Restaurants and cafes', categories: 'restaurant,cafe,bar' },
        ];
        
        for (const attempt of fallbackAttempts) {
          if (places.length > 0) break; // Stop if we found something
          
          try {
            console.log(`   Fallback attempt: ${attempt.name} (${attempt.categories})`);
            const fallbackPlaces = hasCoords
              ? await MapsAPIService.getPlacesByCategory(lat, lon, attempt.categories)
              : await MapsAPIService.getPlacesByCategoryNear(destination, attempt.categories);
            
            if (fallbackPlaces && fallbackPlaces.length > 0) {
              const defaultInterest = interests[0] || 'General Sightseeing';
              places = fallbackPlaces.map((p: any) => ({ ...p, interest: defaultInterest }));
              placesSource = 'osm-fallback';
              console.log(`   ✅ FALLBACK SUCCESS (${attempt.name}): Found ${places.length} places!`);
              break;
            } else {
              console.log(`   ❌ No results for ${attempt.name}`);
            }
          } catch (err: any) {
            console.error(`   ❌ Error in ${attempt.name} search:`, err.message);
          }
        }
        
        if (places.length === 0) {
          console.warn('\n💡 ALL OSM SEARCHES FAILED - PROCEEDING WITH AI-ONLY PLANNING');
          console.warn('   AI will use its built-in knowledge of', destination);
          console.warn('   Results will be generated purely by AI\n');
          placesSource = 'ai-only';
        }
      }
      
      if (places.length > 0) {
        console.log(`✅ Ready to plan trip with ${places.length} real places`);
        console.log(`   Top places: ${places.slice(0, 5).map(p => `${p.name} (${p.interest})`).join(', ')}`);
      }

      // Try Groq AI-based itinerary when configured; fall back to deterministic timeline if it fails.
      let timeline: any[] | null = null;
      let itinerarySource: 'groq-ai' | 'heuristic' | 'fallback-db' = 'heuristic';
      
      console.log(`\n🔍 Groq AI Check:`);
      console.log(`   Places available: ${places.length}`);
      console.log(`   GROQ_API_KEY exists: ${!!process.env.GROQ_API_KEY}`);
      console.log(`   GROQ_API_KEY length: ${process.env.GROQ_API_KEY?.length || 0}`);
      
      // Try AI even if no places - AI can use its own knowledge
      if (process.env.GROQ_API_KEY) {
        try {
          console.log('🤖 Attempting Groq AI itinerary generation...');
          if (places.length > 0) {
            console.log(`   Will send up to ${Math.min(places.length, 25)} places to Groq AI`);
          } else {
            console.log('   No places from APIs - AI will use its built-in knowledge of', destination);
          }
          timeline = await this.buildTimelineWithGroqAI({
            destination,
            days,
            travelers,
            budget,
            currency,
            interests,
            places,
          });
          itinerarySource = 'groq-ai';
          console.log('✅ Groq AI itinerary generated successfully');
        } catch (error: any) {
          console.error('❌ Groq AI itinerary generation failed:');
          console.error('   Error:', error.message);
          console.error('   Error type:', error.constructor.name);
          if (error.message.includes('vague') || error.message.includes('VAGUE')) {
            console.error('   ⚠️ AI returned vague titles - rejecting AI output');
            console.error('   This usually happens when:');
            console.error('     • AI doesn\'t have good data for this location');
            console.error('     • The destination is too small/obscure');
            console.error('     • Network quality affected API response');
          }
          if (error.stack) {
            console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
          }
          // Only fallback if we have real places from APIs
          if (places.length > 0) {
            console.warn('⚠️ Falling back to heuristic timeline with real places');
            timeline = null;
          } else {
            // No places AND AI failed = throw helpful error
            throw new Error(`Cannot generate itinerary for ${destination}: No tourist places found in OpenStreetMap and AI generation failed. This may be a very remote/obscure location. Try: (1) Check internet connection, (2) Verify GROQ_API_KEY is valid, (3) Try a nearby major city instead.`);
          }
        }
      } else if (!process.env.GROQ_API_KEY) {
        console.log('ℹ️ GROQ_API_KEY not found, using heuristic timeline');
        itinerarySource = 'fallback-db';
      }

      if (!timeline) {
        if (places.length === 0) {
          throw new Error(`Cannot generate itinerary: No places found for ${destination} and AI generation failed. Please check your API keys (GROQ_API_KEY and FOURSQUARE_API_KEY) and try again.`);
        }
        console.log('📋 Building heuristic timeline from places...');
        timeline = this.buildTimelineFromPlaces(places, days, currency, budget, interests);
      }

      console.log("\n✅ TRIP GENERATED WITH REAL PLACES");
      
      // 🚨 FINAL VALIDATION: Check timeline for any vague titles before returning
      console.log('🔍 Final validation check...');
      const bannedKeywords = ['visit', 'explore', 'exploration', 'overview', 'popular spots', 'local attractions'];
      const destBase = destination.split(',')[0].trim().toLowerCase();
      let vagueCount = 0;
      
      timeline.forEach((dayItem: any) => {
        dayItem.activities?.forEach((activity: any) => {
          const title = String(activity.title || '').toLowerCase().trim();
          const hasVagueWord = bannedKeywords.some(word => title.includes(word));
          
          // Smart check - reject "Visit Tokyo" but allow "Tokyo Tower"
          const vaguePatterns = [
            `visit ${destBase}`,
            `explore ${destBase}`,
            `${destBase} exploration`,
            `${destBase} overview`
          ];
          const hasVaguePattern = vaguePatterns.some(pattern => title.includes(pattern));
          const isJustDestination = title === destBase || title === destination.toLowerCase();
          
          if (hasVagueWord || hasVaguePattern || isJustDestination) {
            vagueCount++;
            console.error(`   ❌ VAGUE TITLE: "${activity.title}"`);
          }
        });
      });
      
      if (vagueCount > 0) {
        console.error(`\n❌ FINAL VALIDATION FAILED: ${vagueCount} vague titles detected!`);
        throw new Error(`Timeline contains ${vagueCount} vague/generic place names. All activities must be specific real places.`);
      }
      
      console.log('✅ Final validation passed - all titles are real place names\n');
      
      // Check for empty timeline
      const totalActivities = timeline.reduce((sum: number, d: any) => sum + (d.activities?.length || 0), 0);
      if (totalActivities === 0) {
        throw new Error('Generated timeline has no activities. This usually means no places were found and AI generation failed.');
      }
      console.log(`✅ Timeline has ${totalActivities} total activities across ${timeline.length} days`);

      return {
        destination,
        days: days,
        travelers,
        totalBudget: budget * travelers,
        currency,
        interests,
        timeline: timeline,
        isMockData: false,
        source: itinerarySource,
      };
    } catch (err: any) {
      console.error("\n❌ CRITICAL ERROR GENERATING TRIP:");
      console.error("   Message:", err.message);
      console.error("   Stack:", err.stack);
      console.error("   Destination:", input.destination);
      console.error("   Interests:", input.interests);
      
      // DO NOT return fallback - throw error to alert user
      throw new Error(`Failed to generate itinerary for ${input.destination}: ${err.message}`);
    }
  }

  private static async buildTimelineWithGroqAI(args: {
    destination: string;
    days: number;
    travelers: number;
    budget: number;
    currency: string;
    interests: string[];
    places: any[];
  }): Promise<any[]> {
    // Send ALL available places to AI (already balanced/shuffled by interest)
    const placesForPrompt = args.places.map((p: any) => ({
      name: p.name,
      category: p.interest || p.categories || p.description || 'Place',
      rating: p.rating ?? 4.2,
      address: p.address || p.description || '',
      lat: p.lat,
      lon: p.lon,
    }));
    
    console.log(`📋 Sending ${placesForPrompt.length} places to Groq AI for planning`);
    
    const hasPlaceData = placesForPrompt.length > 0;
    
    const prompt = hasPlaceData 
      ? `You are a professional travel itinerary planner. You MUST create a real, actionable plan.

⚠️ CRITICAL RULES - FAILURE TO FOLLOW = INVALID RESPONSE:

1. NEVER use placeholder text like:
   ❌ "Visit ${args.destination}"
   ❌ "${args.destination} Exploration"
   ❌ "Popular attractions"
   ❌ "Local spots"
   ❌ "Explore the city"
   ❌ "Overview of ${args.destination}"

2. 🚫 ABSOLUTELY FORBIDDEN - DO NOT INCLUDE THESE PLACES:
   ❌ Banks, ATMs, post offices
   ❌ Hospitals, clinics, pharmacies, medical centers
   ❌ Schools, universities, colleges
   ❌ Police stations, fire stations
   ❌ Supermarkets, convenience stores
   ❌ Government offices, embassies
   ❌ Generic service buildings
   ✅ ONLY include TOURIST ATTRACTIONS, cultural sites, restaurants, parks, museums, monuments, entertainment venues

3. YOU MUST use ONLY the exact place names from the list below
4. Each activity title MUST be a specific place name (not a description)
5. DO NOT invent new places - use ONLY what's in the list
6. DO NOT rename places - copy names EXACTLY
7. 🌍 ALL OUTPUT MUST BE IN ENGLISH ONLY - No Japanese, Korean, Chinese, Hindi, or any local language scripts
8. 🎯 VARIETY IS CRITICAL: If user selected multiple interests, ensure DIFFERENT places for each
   ${args.interests.length > 1 ? `  ⚠️ User selected ${args.interests.length} interests: ${args.interests.join(', ')}` : ''}
   ${args.interests.length > 1 ? '  ⚠️ DISTRIBUTE activities across ALL interests - DO NOT repeat same places' : ''}
   ${args.interests.length > 1 ? '  ⚠️ Example: If "Food + History" → include BOTH restaurants AND museums, not just one type' : ''}
   ${args.interests.length > 1 ? `  ⚠️ Each day should MIX different interest categories` : ''}
9. 🔀 PLACE SELECTION STRATEGY:
   - Look at the "category" field in the place list below
   - Distribute activities across DIFFERENT categories
   - Avoid selecting too many places from the same category
   - Aim for variety and balance across the trip

Destination: ${args.destination}
Days: ${args.days}
Budget: ${args.currency} ${args.budget * args.travelers} (total for ${args.travelers} travelers)
Budget per day: ${args.currency} ${Math.floor((args.budget * args.travelers) / args.days)}
User interests: ${args.interests.length ? args.interests.join(', ') : 'General sightseeing'}

🏛️ AVAILABLE REAL PLACES (use these EX ACT names):
${JSON.stringify(placesForPrompt, null, 2)}

📋 REQUIRED JSON FORMAT (return ONLY this, no explanation):
{
  "timeline": [
    {
      "day": 1,
      "activities": [
        {
          "time": "09:00 AM",
          "title": "<EXACT place name from list above>",
          "subtitle": "<Brief reason why this place matches user interests>",
          "rating": 4.5,
          "badge": "Recommended",
          "info": "${args.currency} <cost> • <duration like 2h>",
          "mapSearchName": "<same as title>",
          "lat": <latitude number>,
          "lon": <longitude number>
        }
      ]
    }
  ]
}

✅ REQUIREMENTS:
- Create exactly ${args.days} days (day 1 to ${args.days})
- Put 3-5 activities per day
- Start times between 09:00 AM and 08:00 PM
- 🔀 VARIETY & DISTRIBUTION:
  ${args.interests.length > 1 ? `  ⚠️ User wants ${args.interests.length} interests: ${args.interests.join(', ')}` : `  ⚠️ User interest: ${args.interests[0]}`}
  ${args.interests.length > 1 ? '  ⚠️ DISTRIBUTE activities across ALL interests throughout the trip' : ''}
  ${args.interests.length > 1 ? '  ⚠️ DO NOT group all activities of one interest together' : ''}
  ${args.interests.length > 1 ? '  ⚠️ Each day should ideally have a MIX of different interest categories' : ''}
  ${args.interests.length > 1 ? '  ⚠️ Example for "Food + History": Day 1 might have restaurant→museum→cafe→monument (mixed)' : ''}
- Each activity subtitle MUST explicitly explain how it matches the specified interests
- VARY costs realistically: food (15-25%), history/museums (3-10%), nature (5-12%), shopping (20-35%), adventure (15-30%)
- Total cost should sum to approximately ${args.currency} ${args.budget * args.travelers}
- Higher rated places (4.5+) should have slightly higher costs
- Copy lat/lon from the places list above

🚫 VALIDATION:
If any activity title contains words like "visit", "explore", "overview", or the city name "${args.destination}", the response is INVALID.
Each title MUST be a specific place name from the list.
`
      : `You are a professional travel itinerary planner with worldwide knowledge. Create a REAL, SPECIFIC itinerary.

⚠️ CRITICAL RULES:

1. NEVER use placeholder text like:
   ❌ "Visit ${args.destination}"
   ❌ "${args.destination} Exploration"
   ❌ "Popular attractions"
   ❌ "Explore the city"

2. 🚫 ABSOLUTELY FORBIDDEN - DO NOT INCLUDE THESE PLACES:
   ❌ Banks, ATMs, post offices
   ❌ Hospitals, clinics, pharmacies, medical centers
   ❌ Schools, universities, colleges
   ❌ Police stations, fire stations
   ❌ Supermarkets, convenience stores
   ❌ Government offices, embassies
   ❌ Generic service buildings
   ✅ ONLY include TOURIST ATTRACTIONS: temples, museums, monuments, parks, restaurants, cultural sites, entertainment venues, scenic spots

3. YOU MUST list REAL, FAMOUS, SPECIFIC places in ${args.destination}
4. Each title must be an actual place name (temple, restaurant, museum, park, etc.)
5. Use your knowledge of ${args.destination} to suggest real attractions
6. DO NOT use the city name in activity titles
7. 🌍 ALL OUTPUT MUST BE IN ENGLISH ONLY - Use English-transliterated names
8. ✅ Every place MUST have valid coordinates within 20km of ${args.destination}
9. ❌ If you cannot find specific real places, DO NOT fabricate - return empty timeline
10. 🎯 STRICT INTEREST MATCHING: ONLY recommend places that DIRECTLY match the user's interests
   ${args.interests.length > 0 ? `  ⚠️ User interests are: ${args.interests.join(', ')} - STICK TO THESE ONLY` : ''}
   ${args.interests.length > 0 ? '  ⚠️ DO NOT recommend places outside these categories' : ''}
   ${args.interests.length > 0 ? '  ⚠️ Example: If interests are "Food, History", do NOT suggest shopping malls or adventure parks' : ''}

Destination: ${args.destination}
Days: ${args.days}
Budget: ${args.currency} ${args.budget * args.travelers} (for ${args.travelers} travelers)
Budget per day: ${args.currency} ${Math.floor((args.budget * args.travelers) / args.days)}
User interests: ${args.interests.length ? args.interests.join(', ') : 'General sightseeing'}

Examples of GOOD titles (ENGLISH ONLY):
✅ "Eiffel Tower" (Paris)
✅ "Senso-ji Temple" (Tokyo) - NOT "浅草寺"
✅ "Colosseum" (Rome)
✅ "Tsukiji Fish Market" (Tokyo) - NOT "築地市場"
✅ "Fushimi Inari Shrine" (Kyoto) - NOT "伏見稲荷大社"
✅ "Gyeongbokgung Palace" (Seoul) - NOT "경복궁"

Examples of BAD titles:
❌ "Visit Paris"
❌ "Explore Tokyo"
❌ "Popular spots in Rome"
❌ "東京タワー" (use "Tokyo Tower" instead)
❌ "เกาะพีพี" (use "Phi Phi Islands" instead)

📋 REQUIRED JSON FORMAT:
{
  "timeline": [
    {
      "day": 1,
      "activities": [
        {
          "time": "09:00 AM",
          "title": "<Specific real place name>",
          "subtitle": "<Why it matches interests>",
          "rating": 4.5,
          "badge": "Recommended",
          "info": "${args.currency} <cost> • <duration>",
          "mapSearchName": "<same as title>",
          "lat": 0,
          "lon": 0
        }
      ]
    }
  ]
}

REQUIREMENTS:
- ${args.days} days total
- 3-5 activities per day
- Times: 09:00 AM - 08:00 PM
- 🎯 STRICT: ONLY include places that DIRECTLY match these interests: ${args.interests.join(', ')}
  ${args.interests.length > 0 ? '  ⚠️ DO NOT suggest places outside these categories' : ''}
  ${args.interests.length > 0 ? '  ⚠️ Each subtitle MUST clearly state HOW the place matches the specified interests' : ''}
  ${args.interests.length > 0 ? '  ⚠️ If a place belongs to Food interest, it should be restaurants/markets. If History, it should be museums/historic sites, etc.' : ''}
- VARY costs realistically: restaurants (15-25%), museums (5-12%), parks/temples (3-8%), activities (20-35%)
- Total cost ≈ ${args.currency} ${args.budget * args.travelers}
- Higher rated/famous places = higher costs
- EVERY title must be a real place name in ENGLISH
- All place names within 20km radius of ${args.destination}
- NO generic or vague titles - be SPECIFIC
- If unsure about a place, DO NOT include it
`;


    const ai = await OpenAIService.generateItineraryJson(prompt);
    const timeline = ai?.timeline;
    
    console.log('🔍 Validating AI response...');
    console.log('   Has timeline:', !!timeline);
    console.log('   Is array:', Array.isArray(timeline));
    console.log('   Timeline length:', timeline?.length);
    console.log('   Expected days:', args.days);
    
    if (!Array.isArray(timeline)) {
      console.error('❌ Timeline is not an array');
      throw new Error('Groq AI returned invalid timeline structure');
    }
    
    if (timeline.length === 0) {
      console.error('❌ Timeline is empty');
      throw new Error('Groq AI returned empty timeline');
    }
    
    // Allow flexible day count (AI might return different number of days)
    if (timeline.length !== args.days) {
      console.warn(`⚠️ AI returned ${timeline.length} days instead of ${args.days}, adjusting...`);
    }
    
    // 🚨 CRITICAL: Validate NO vague titles
    console.log('\n🔍 Validating for vague/generic place names...');
    const bannedWords = ['visit', 'explore', 'exploration', 'overview', 'popular', 'local spots', 'attractions'];
    
    // Smart destination detection - only reject if STARTING with banned phrase + destination
    // ✅ "Tokyo Tower" - OK (real place with city name)
    // ❌ "Visit Tokyo" - REJECT (vague)
    // ❌ "Explore Tokyo" - REJECT (vague)
    const destinationBase = args.destination.split(',')[0].trim().toLowerCase(); // "Tokyo" from "Tokyo, Japan"
    const vagueActivities: string[] = [];
    
    timeline.forEach((day: any, dayIdx: number) => {
      if (day.activities && Array.isArray(day.activities)) {
        day.activities.forEach((activity: any, actIdx: number) => {
          const title = String(activity.title || '').toLowerCase().trim();
          
          // Check for banned words
          const hasBannedWord = bannedWords.some(word => title.includes(word));
          
          // Check for vague patterns like "Visit Tokyo" but allow "Tokyo Tower"
          const vaguePatterns = [
            `visit ${destinationBase}`,
            `explore ${destinationBase}`,
            `${destinationBase} exploration`,
            `${destinationBase} overview`,
            `popular ${destinationBase}`,
            `${destinationBase} attractions`
          ];
          const hasVaguePattern = vaguePatterns.some(pattern => title.includes(pattern));
          
          // Reject if title is ONLY the destination name (e.g., just "Tokyo")
          const isJustDestination = title === destinationBase || title === args.destination.toLowerCase();
          
          if (hasBannedWord || hasVaguePattern || isJustDestination) {
            const issue = `Day ${day.day}, Activity ${actIdx + 1}: "${activity.title}"`;
            vagueActivities.push(issue);
            console.error(`   ❌ VAGUE TITLE DETECTED: ${issue}`);
            if (hasBannedWord) console.error(`      Reason: Contains banned word`);
            if (hasVaguePattern) console.error(`      Reason: Matches vague pattern`);
            if (isJustDestination) console.error(`      Reason: Title is just the destination name`);
          }
        });
      }
    });
    
    if (vagueActivities.length > 0) {
      console.error('\n❌ AI RETURNED VAGUE TITLES - REJECTING RESPONSE');
      console.error('   Vague activities found:', vagueActivities.length);
      console.error('   Examples:', vagueActivities.slice(0, 3));
      throw new Error(`AI generated vague place names instead of real places. Found ${vagueActivities.length} generic titles like "${vagueActivities[0]}". This is not acceptable.`);
    }
    
    console.log('✅ All activity titles are specific place names (no vague titles detected)');

    // Minimal validation + normalization so the UI doesn't crash.
    return timeline.map((dayObj: any, index: number) => {
      const activities = Array.isArray(dayObj?.activities) ? dayObj.activities : [];
      return {
        day: typeof dayObj?.day === 'number' ? dayObj.day : index + 1,
        activities: activities
          .filter((a: any) => a && a.title)
          .map((a: any) => ({
            time: String(a.time || '09:00 AM'),
            title: String(a.title),
            subtitle: String(a.subtitle || ''),
            rating: Number.isFinite(Number(a.rating)) ? Number(a.rating) : 4.2,
            badge: String(a.badge || 'Recommended'),
            info: String(a.info || ''),
            mapSearchName: String(a.mapSearchName || a.title),
            lat: Number(a.lat),
            lon: Number(a.lon),
          })),
      };
    });
  }

  private static buildTimelineFromPlaces(places: any[], days: number, currency: string, budget: number, interests: string[]) {
    console.log('\n🎯 ========== BUILDING TIMELINE ==========');
    console.log('   Total places available:', places.length);
    console.log('   Days to plan:', days);
    console.log('   Budget per person:', budget, currency);
    
    if (places.length === 0) {
      throw new Error('Cannot build timeline: No places available. Foursquare API returned 0 results.');
    }
    console.log('   Budget per day:', Math.floor(budget / days), currency);
    console.log('   User interests:', interests.join(', '));
    
    const timeline = [];
    const budgetPerDay = Math.floor(budget / days);
    const activitiesPerDay = Math.min(4, Math.max(3, Math.ceil(places.length / days)));
    
    console.log('   Activities per day:', activitiesPerDay);
    
    // Prioritize places matching user interests
    const prioritized = [...places].sort((a, b) => {
      const aMatches = interests.some(int => a.interest?.toLowerCase() === int.toLowerCase());
      const bMatches = interests.some(int => b.interest?.toLowerCase() === int.toLowerCase());
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return (b.rating || 0) - (a.rating || 0); // Sort by rating
    });
    
    console.log('\n   📋 Prioritized places (top 5):');
    prioritized.slice(0, 5).forEach((p, i) => {
      console.log(`      ${i+1}. "${p.name}" (${p.interest}) - ${p.rating}⭐`);
    });
    
    for (let day = 1; day <= days; day++) {
      const startIdx = (day - 1) * activitiesPerDay;
      const endIdx = Math.min(startIdx + activitiesPerDay, prioritized.length);
      const dayPlaces = prioritized.slice(startIdx, endIdx);
      
      const activities: any[] = [];
      const times = ['09:00 AM', '12:00 PM', '03:00 PM', '06:00 PM'];
      
      console.log(`\n   Day ${day} places:`);
      
      dayPlaces.forEach((place, idx) => {
        // Smart cost estimation with variation based on category, rating, and randomness
        let baseCostPercent = 0.15; // Default
        let variationRange = 0.03; // ±3% variation
        
        if (place.interest === 'Food') {
          baseCostPercent = 0.18; // 15-21% for food
          variationRange = 0.05;
        } else if (place.interest === 'History') {
          baseCostPercent = 0.06; // 3-9% for museums/monuments
          variationRange = 0.03;
        } else if (place.interest === 'Nature') {
          baseCostPercent = 0.08; // 5-11% for parks/nature
          variationRange = 0.03;
        } else if (place.interest === 'Adventure') {
          baseCostPercent = 0.22; // 17-27% for adventure activities
          variationRange = 0.05;
        } else if (place.interest === 'Shopping') {
          baseCostPercent = 0.25; // 20-30% for shopping
          variationRange = 0.05;
        } else if (place.interest === 'Nightlife') {
          baseCostPercent = 0.20; // 15-25% for nightlife
          variationRange = 0.05;
        }
        
        // Add random variation
        const randomVariation = (Math.random() - 0.5) * 2 * variationRange;
        const finalPercent = baseCostPercent + randomVariation;
        
        // Rating bonus: higher rated places = slightly higher cost (up to +10%)
        const ratingBonus = place.rating ? (place.rating - 4.0) * 0.02 : 0;
        
        let cost = Math.round(budgetPerDay * (finalPercent + ratingBonus));
        
        // Round to nearest 50 or 100 for cleaner numbers
        if (cost > 500) {
          cost = Math.round(cost / 100) * 100;
        } else if (cost > 100) {
          cost = Math.round(cost / 50) * 50;
        }
        
        const activity = {
          time: times[idx % times.length],
          title: place.name,
          subtitle: place.address || place.categories || `${place.interest} destination`,
          rating: Number.isFinite(place.rating) && place.rating > 0 ? place.rating : 4.2,
          badge: this.getBadgeForActivity(place.interest, "Recommended"),
          info: `${currency} ${cost} • ${place.interest === 'Food' ? '1.5h' : '2h'}`,
          mapSearchName: place.name,
          lat: place.lat,
          lon: place.lon,
        };
        
        console.log(`      ${times[idx % times.length]} - "${place.name}" (${place.interest})`);
        
        activities.push(activity);
      });
      
      timeline.push({ day, activities });
    }
    
    console.log('\n✅ Timeline built successfully');
    console.log(`   Total days: ${timeline.length}`);
    console.log(`   Total activities: ${timeline.reduce((sum, d) => sum + d.activities.length, 0)}`);
    console.log('========================================\n');
    
    return timeline;
  }

  private static getBadgeForActivity(category: string, safety: string): string {
    if (category === "Food Spots") return "Dining";
    if (category === "Cultural and Historical") return "Cultural Site";
    if (category === "Romantic for Couples") return "Romantic";
    if (category === "Family-Friendly") return "Family Spot";
    if (category === "Adventure and Outdoor") return "Adventure";
    return "Recommended";
  }

  private static async getNearbyPlaces(args: {
    destination: string;
    lat: number;
    lon: number;
    interests: string[];
  }) {
    const allPlaces: any[] = [];
    // Updated category map using OpenStreetMap tags (not Foursquare codes)
    // 🎯 DISTINCT categories per interest - minimal overlap to ensure variety
    const categoryMap: Record<string, string> = {
      "Food Spots": "restaurant,cafe,bar,fast_food,food_court,ice_cream,pub,bistro,bakery",
      "Cultural and Historical": "museum,monument,castle,memorial,archaeological_site,ruins,fort,palace,temple,gallery",
      "Romantic for Couples": "restaurant,cafe,viewpoint",
      "Family-Friendly": "zoo,theme_park,park,garden",
      "Adventure and Outdoor": "nature_reserve,beach,viewpoint,sports_centre",
      // Legacy mappings for backward compatibility
      History: "museum,monument,castle,memorial,archaeological_site,ruins,fort,palace",
      Food: "restaurant,cafe,bar,market",
      Nature: "park,garden,beach,nature_reserve",
      Adventure: "nature_reserve,beach,viewpoint,sports_centre",
      Shopping: "market,mall",
      Nightlife: "bar,cafe",
      Art: "museum,gallery,artwork",
      Museums: "museum,gallery",
    };

    const interests = args.interests.length ? args.interests : ["Cultural and Historical", "Food Spots"];
    const hasCoords = isValidCoordinate(args.lat, args.lon);
    
    console.log(`\n🔍 Detailed Foursquare Search:`);
    console.log(`   Searching for ${interests.length} interest categories`);
    console.log(`   Interests: ${interests.join(', ')}`);
    console.log(`   Search method: ${hasCoords ? 'Coordinates (lat/lon)' : 'Destination name'}`);
    
    for (const interest of interests) {
      const category = categoryMap[interest] || "16000";
      console.log(`\n   📍 Fetching ${interest} places...`);
      console.log(`      Category code: ${category}`);
      console.log(`      Method: ${hasCoords ? `getPlacesByCategory(${args.lat}, ${args.lon})` : `getPlacesByCategoryNear("${args.destination}")` }`);
      
      try {
        const places = hasCoords
          ? await MapsAPIService.getPlacesByCategory(args.lat, args.lon, category)
          : await MapsAPIService.getPlacesByCategoryNear(args.destination, category);
        
        if (places && places.length > 0) {
          const placesWithInterest = places.map((p: any) => ({ ...p, interest }));
          allPlaces.push(...placesWithInterest);
          console.log(`      ✅ Found ${places.length} ${interest} places`);
          console.log(`      Examples: ${places.slice(0, 2).map((p: any) => p.name).join(', ')}`);
        } else {
          console.log(`      ⚠️ No ${interest} places found for ${args.destination}`);
        }
      } catch (error: any) {
        console.error(`      ❌ Error fetching ${interest} places:`);
        console.error(`         Error: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Foursquare search complete:`);
    console.log(`   Total places found: ${allPlaces.length}`);
    
    if (allPlaces.length > 0) {
      console.log(`   Place breakdown by interest:`);
      interests.forEach(int => {
        const count = allPlaces.filter(p => p.interest === int).length;
        console.log(`      ${int}: ${count} places`);
      });
    }
    
    // 🎯 SMART DISTRIBUTION: Ensure variety by distributing places by interest
    // Instead of just slicing top 40, balance across interests
    const balancedPlaces: any[] = [];
    const maxPerInterest = Math.ceil(40 / interests.length);
    
    console.log(`\n🎯 Balancing places across ${interests.length} interests (max ${maxPerInterest} per interest)`);
    
    for (const interest of interests) {
      const interestPlaces = allPlaces.filter(p => p.interest === interest);
      const selected = interestPlaces.slice(0, maxPerInterest);
      balancedPlaces.push(...selected);
      console.log(`   ${interest}: Selected ${selected.length}/${interestPlaces.length} places`);
    }
    
    // Shuffle to mix different interests throughout the list
    const shuffled = this.shuffleArray(balancedPlaces);
    
    console.log(`   Total balanced places: ${shuffled.length}`);
    console.log(`   Returning ${shuffled.length} places for itinerary generation`);
    
    if (shuffled.length > 0) {
      console.log(`   Sample mixed places:`);
      shuffled.slice(0, 5).forEach((p, i) => {
        console.log(`      ${i+1}. "${p.name}" (${p.interest}) - ${p.rating}⭐`);
      });
    }
    
    return shuffled;
  }

  // Fisher-Yates shuffle algorithm to mix places from different interests
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
