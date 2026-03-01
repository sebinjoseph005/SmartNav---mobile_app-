import { supabase } from './supabase';

export interface SavedTrip {
    id: string;
    user_id: string;
    destination: string;
    interests: string[];
    from_date: string;
    to_date: string;
    travelers: number;
    budget: number;
    currency: string;
    itinerary: any;
    created_at: string;
}

/**
 * Save a generated itinerary to Supabase for the logged-in user.
 */
export async function saveTrip(params: {
    userId: string;
    destination: string;
    interests: string[];
    fromDate: string;
    toDate: string;
    travelers: number;
    budget: number;
    currency: string;
    itinerary: any;
}): Promise<void> {
    const { error } = await supabase.from('saved_trips').insert({
        user_id: params.userId,
        destination: params.destination,
        interests: params.interests,
        from_date: params.fromDate,
        to_date: params.toDate,
        travelers: params.travelers,
        budget: params.budget,
        currency: params.currency,
        itinerary: params.itinerary,
    });

    if (error) throw new Error(error.message);
}

/**
 * Fetch all saved trips for the logged-in user, newest first.
 */
export async function getSavedTrips(userId: string): Promise<SavedTrip[]> {
    const { data, error } = await supabase
        .from('saved_trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as SavedTrip[]) || [];
}

/**
 * Delete a saved trip by id.
 */
export async function deleteSavedTrip(tripId: string): Promise<void> {
    const { error } = await supabase
        .from('saved_trips')
        .delete()
        .eq('id', tripId);

    if (error) throw new Error(error.message);
}
