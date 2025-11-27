// Mock Data (Based on TodayDataSeeder.php)
// We add an 'optimalIndex' to simulate what the Python script would calculate
const MOCK_DATA = [
    {
        id: 1,
        name: "Route 1 (Noord/West)",
        color: "#ef4444", // Red
        locations: [
            // Intentionally scrambled order for demo purposes
            { id: 101, name: "Hoofdkantoor Amsterdam", address: "Hoofdstraat 123", city: "Amsterdam", lat: 52.3727598, lng: 4.8936041, optimalIndex: 0 },
            { id: 103, name: "Stadhuis Almere", address: "Stadhuisplein 1", city: "Almere", lat: 52.370216, lng: 5.220000, optimalIndex: 2 },
            { id: 102, name: "Grote Markt Haarlem", address: "Grote Markt 2", city: "Haarlem", lat: 52.381252, lng: 4.636625, optimalIndex: 1 },
        ]
    },
    {
        id: 2,
        name: "Route 2 (Zuid)",
        color: "#3b82f6", // Blue
        locations: [
            { id: 201, name: "Havenbedrijf", address: "Wilhelminakade 77", city: "Rotterdam", lat: 51.905403, lng: 4.486076, optimalIndex: 0 },
            { id: 202, name: "Grote Markt Breda", address: "Grote Markt 38", city: "Breda", lat: 51.588, lng: 4.775, optimalIndex: 2 }, // Intentionally inefficient
            { id: 203, name: "Ministerie Binnenhof", address: "Binnenhof 1", city: "Den Haag", lat: 52.078663, lng: 4.313341, optimalIndex: 1 },
        ]
    },
    {
        id: 3,
        name: "Route 3 (Oost)",
        color: "#10b981", // Green
        locations: [
            { id: 301, name: "Stationsplein Utrecht", address: "Stationsplein 15", city: "Utrecht", lat: 52.090833, lng: 5.111111, optimalIndex: 0 },
            { id: 302, name: "Radboud Universiteit", address: "Comeniuslaan 4", city: "Nijmegen", lat: 51.822305, lng: 5.866587, optimalIndex: 2 },
            { id: 303, name: "Openluchtmuseum", address: "Schelmseweg 89", city: "Arnhem", lat: 52.010769, lng: 5.904171, optimalIndex: 1 },
        ]
    }
];

// State
let routes = JSON.parse(JSON.stringify(MOCK_DATA)); // Deep copy
let map;
let markers = {};
let polylines = {};

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderRoutes();
    document.getElementById('reset-btn').addEventListener('click', resetDemo);
});

function initMap() {
    // Center of Netherlands
    map = L.map('map').setView([52.1326, 5.2913], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function renderRoutes() {
    const container = document.getElementById('routes-container');
    container.innerHTML = '';

    // Clear map layers
    Object.values(markers).forEach(layer => map.removeLayer(layer));
    Object.values(polylines).forEach(layer => map.removeLayer(layer));
    markers = {};
    polylines = {};

    routes.forEach(route => {
        // 1. Render HTML Card
        const card = document.createElement('div');
        card.className = 'route-card';
        card.innerHTML = `
            <div class="route-header">
                <div class="route-title">
                    <span class="route-color-dot" style="background-color: ${route.color}"></span>
                    ${route.name}
                </div>
                <div class="route-actions">
                    <button onclick="optimizeRoute(${route.id}, this)">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Optimaliseer
                    </button>
                </div>
            </div>
            <div class="location-list" id="route-list-${route.id}" data-route-id="${route.id}">
                ${route.locations.map((loc, index) => `
                    <div class="location-item" data-id="${loc.id}">
                        <div class="loc-order">${index + 1}</div>
                        <div class="loc-details">
                            <h4>${loc.name}</h4>
                            <p>${loc.address}, ${loc.city}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);

        // 2. Initialize SortableJS
        const listEl = card.querySelector('.location-list');
        new Sortable(listEl, {
            group: 'shared-routes', // Allow dragging between routes
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            onEnd: function (evt) {
                handleDragDrop(evt);
            }
        });

        // 3. Render Map Elements
        const latlngs = route.locations.map(l => [l.lat, l.lng]);
        
        // Add markers
        route.locations.forEach((loc, i) => {
            const marker = L.marker([loc.lat, loc.lng], {
                icon: createNumberedIcon(i + 1, route.color)
            }).bindPopup(`<b>${loc.name}</b><br>${loc.address}`);
            marker.addTo(map);
            markers[loc.id] = marker;
        });

        // Add Polyline
        if (latlngs.length > 1) {
            const polyline = L.polyline(latlngs, { color: route.color, weight: 4, opacity: 0.7 }).addTo(map);
            polylines[route.id] = polyline;
        }
    });
}

function handleDragDrop(evt) {
    const fromRouteId = parseInt(evt.from.dataset.routeId);
    const toRouteId = parseInt(evt.to.dataset.routeId);
    const oldIndex = evt.oldIndex;
    const newIndex = evt.newIndex;

    // Logic to update the 'routes' state array based on drag
    if (fromRouteId === toRouteId) {
        // Reordering within same route
        const route = routes.find(r => r.id === fromRouteId);
        const [movedItem] = route.locations.splice(oldIndex, 1);
        route.locations.splice(newIndex, 0, movedItem);
    } else {
        // Moving between routes
        const fromRoute = routes.find(r => r.id === fromRouteId);
        const toRoute = routes.find(r => r.id === toRouteId);
        const [movedItem] = fromRoute.locations.splice(oldIndex, 1);
        toRoute.locations.splice(newIndex, 0, movedItem);
    }

    // Re-render everything to update map and order numbers
    renderRoutes();
}

// Simulate the backend optimization calculation
window.optimizeRoute = function(routeId, btn) {
    const route = routes.find(r => r.id === routeId);
    
    // UI Feedback
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Bezig...';
    btn.disabled = true;

    setTimeout(() => {
        // Simple sort based on our hidden "optimalIndex" property
        route.locations.sort((a, b) => a.optimalIndex - b.optimalIndex);
        
        renderRoutes();
        
        // Visual feedback that it's done
        // Note: Button is re-rendered by renderRoutes, so we don't need to reset it manually
    }, 800); // Fake network delay
};

function resetDemo() {
    routes = JSON.parse(JSON.stringify(MOCK_DATA));
    renderRoutes();
    map.setView([52.1326, 5.2913], 8);
}

// Helper for custom markers
function createNumberedIcon(number, color) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color:${color}; width: 24px; height: 24px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${number}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}
