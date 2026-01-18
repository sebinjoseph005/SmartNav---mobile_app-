const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

export async function fetchPlaceSuggestions(query: string) {
  if (!query || query.length < 2) return [];

  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(query)}` +
    `&types=(cities)` +
    `&key=${GOOGLE_API_KEY}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    if (json.status !== 'OK') return [];

    return json.predictions.map((item: any) => ({
      id: item.place_id,
      name: item.description,
    }));
  } catch (e) {
    console.log('Places API error', e);
    return [];
  }
}
