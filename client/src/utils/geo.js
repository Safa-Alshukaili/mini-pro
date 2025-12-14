// client/src/utils/geo.js
export function getMyLocation(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options }
    );
  });
}

// ✅ Reverse Geocoding (OSM Nominatim) -> full details
export async function reverseGeocodeOSM(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}` +
    `&zoom=18&addressdetails=1`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Reverse geocoding failed");

  const data = await res.json();
  const a = data?.address || {};

  // city might be in one of these fields depending on the place
  const city = a.city || a.town || a.village || a.hamlet || "";

  const details = {
    country: a.country || "",
    countryCode: (a.country_code || "").toUpperCase(),
    state: a.state || "",                 // often = Governorate / Region
    county: a.county || "",
    city,
    suburb: a.suburb || a.neighbourhood || "",
    road: a.road || "",
    houseNumber: a.house_number || "",
    postcode: a.postcode || "",
    // extra (sometimes available)
    village: a.village || "",
    town: a.town || "",
    municipality: a.municipality || "",
    displayName: data?.display_name || "",
  };

  // ✅ nice label for UI (you can change order)
  const parts = [
    details.houseNumber && details.road ? `${details.houseNumber} ${details.road}` : (details.road || ""),
    details.suburb,
    details.city,
    details.county,
    details.state,
    details.postcode,
    details.country,
  ].filter(Boolean);

  const label = parts.join(", ");

  return { details, label };
}
