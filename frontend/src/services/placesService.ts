export async function searchPlaces(query: string) {
  if (!query || query.length < 3) return [];

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json` +
    `&addressdetails=1` +
    `&accept-language=en` +
    `&limit=5`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'SmartNavApp/1.0', // REQUIRED by Nominatim
      },
    });

    return await res.json();
  } catch (e) {
    console.error('Nominatim API error:', e);
    return [];
  }
}
