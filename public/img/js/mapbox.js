/* eslint-disable */

// Mapbox GL JS is loaded globally via script tag
// mapboxgl is available as window.mapboxgl

// Mapbox map initialization

export const displayMap = locations => {
  document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.error('Map element not found');
    return;
  }

  const locations = JSON.parse(mapElement.dataset.locations);
  if (!locations || locations.length === 0) {
    console.error('No locations data');
    return;
  }

  console.log('Mapbox: Loading with', locations.length, 'locations');
  initMap(locations);
});

async function initMap(locations) {
  console.log('Mapbox: Initializing map');

  // Check if mapboxgl is available globally
  if (typeof window.mapboxgl === 'undefined') {
    console.error('Mapbox GL JS not loaded');
    return;
  }

  const mapboxgl = window.mapboxgl;
  
  // Get Mapbox access token from meta tag
  const metaTag = document.querySelector('meta[name="mapbox-access-token"]');
  const accessToken = metaTag ? metaTag.content : null;
  
  if (!accessToken) {
    console.error('Mapbox access token not configured. Please add a meta tag with name="mapbox-access-token" in the HTML head.');
    document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Mapbox access token not configured. Please add a valid Mapbox access token to display the map.</div>';
    return;
  }

  try {
    // Set the access token
    mapboxgl.accessToken = accessToken;

    // Create the map
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: locations[0].coordinates,
      zoom: 10,
      scrollZoom: false
    });

    console.log('Mapbox: Map created');

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create bounds to fit all markers
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((loc, index) => {
      const coords = loc.coordinates;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage = `url('/img/pin.png')`;
      el.style.width = '50px';
      el.style.height = '70px';
      el.style.backgroundSize = 'cover';

      // Create marker
      new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(coords)
        .addTo(map);

      // Add popup
      new mapboxgl.Popup({ offset: 30, closeOnClick: false })
        .setLngLat(coords)
        .setHTML(`<p>Day ${index + 1}: ${loc.description}</p>`)
        .addTo(map);

      bounds.extend(coords);
    });

    // Fit map to all markers
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }

    console.log('Mapbox: Map initialized successfully');
  } catch (error) {
    console.error('Mapbox error:', error);
  }
}
}

