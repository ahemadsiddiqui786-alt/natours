/* eslint-disable */

// Adding API key
const apikey = 'JSNRkLWMepMva1cdWFZT';

// MapTiler map initialization
document.addEventListener('DOMContentLoaded', () => {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  const locations = JSON.parse(mapElement.dataset.locations);
  if (!locations || locations.length === 0) return;

  // Load MapTiler SDK dynamically
  const script = document.createElement('script');
  script.src = 'https://api.maptiler.com/sdk/maptiler-gl/latest/maptiler-gl.js';
  script.async = true;
  script.onload = () => initMap(locations);
  document.head.appendChild(script);

  // Also load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://api.maptiler.com/sdk/maptiler-gl/latest/maptiler-gl.css';
  document.head.appendChild(link);
});

function initMap(locations) {
  // Replace with your MapTiler API key
  const apiKey = 'YOUR_MAPTILER_API_KEY';

  // Create the map
  const map = new maptilersdk.Map({
    container: 'map',
    style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
    center: locations[0].geometry.coordinates,
    zoom: 10,
    scrollZoom: false
  });

  // Add navigation controls
  map.addControl(new maptilersdk.NavigationControl(), 'top-right');

  // Create bounds to fit all markers
  const bounds = new maptilersdk.LngLatBounds();

  locations.forEach((loc, index) => {
    const coords = loc.geometry.coordinates;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = `url('/img/map-marker.png')`;
    el.style.width = '50px';
    el.style.height = '70px';
    el.style.backgroundSize = 'cover';

    // Create marker
    new maptilersdk.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(coords)
      .addTo(map);

    // Add popup
    new maptilersdk.Popup({ offset: 30, closeOnClick: false })
      .setLngLat(coords)
      .setHTML(`<p>Day ${index + 1}: ${loc.properties.description}</p>`)
      .addTo(map);

    bounds.extend(coords);
  });

  // Fit map to all markers
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
  }
}