const fetch = require('node-fetch');

const latitude = 12.9716;
const longitude = 77.5946;

const query = `
[out:json][timeout:20];
(
  node["tourism"="attraction"](around:3000,${latitude},${longitude});
  node["tourism"="museum"](around:3000,${latitude},${longitude});
  node["amenity"="restaurant"](around:3000,${latitude},${longitude});
  node["amenity"="cafe"](around:3000,${latitude},${longitude});
  node["leisure"="park"](around:3000,${latitude},${longitude});
  node["leisure"="garden"](around:3000,${latitude},${longitude});
  node["shop"="mall"](around:3000,${latitude},${longitude});
);
out body;>;out skel qt;
`;

(async () => {
    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text.substring(0, 200));
        const json = JSON.parse(text);
        console.log("Elements:", json.elements?.length);
    } catch (e) {
        console.error(e);
    }
})();
