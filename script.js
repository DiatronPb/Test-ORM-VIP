// Coordonnées approximatives de Polytech Tours
const LAT_POLYTECH = 47.364604;
const LNG_POLYTECH = 0.684748;

// Initialisation de la carte centrée sur Paris
let map = L.map('map', {
    dragging: true, //glisser 
    touchZoom: true, //zoom tactile
    doubleClickZoom: false, //zoom double clic
}).setView([LAT_POLYTECH, LNG_POLYTECH], 17); // Zoom initial

// Tuile OpenStreetMap /!\ à usage policy
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

const radiusCircle = 200; // rayon en px
let currentCircle = null;

map.on('click', function(e) {

    console.log(e);

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Supprimer le cercle précédent s'il existe
    if (currentCircle) {
        map.removeLayer(currentCircle);
        currentCircle = null;
    }
    // Ajouter un cercle à l'endroit cliqué
    currentCircle = L.circleMarker(e.latlng, {
        color: 'blue',
        fillColor: '#blue',
        fillOpacity: 0.5,
        radius: radiusCircle
    }).addTo(map);

    // lancement de la requête

    
    const query = `
    [out:json][timeout:25];
    node["amenity"="college"](around:${radiusCircle},${lat},${lng});
    out body;`;

    const query2 = `
    [out:json];
    (
    node(around:100,${lat},${lng})[amenity];
    way(around:100,${lat},${lng})[highway];
    );
    out body;
    >;
    out skel qt;
    `

    const query3 = `
    [out:json];
    (
    node(around:100,${lat},${lng})[amenity];
    );
    out body;
    `


    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query3);

    console.log(url)

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            console.log(`J'ai trouvé : ${data.elements.length} élément(s)`);
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données :', error);
        }
    );

    
});

map.on('zoomstart', () => {
    if (currentCircle) {
        map.removeLayer(currentCircle);
        currentCircle = null;
    }
});

// source : https://gist.github.com/bizouarn/57ba9f6f0626441870c7d5d6a5773d93
// source : https://osm-queries.ldodds.com/tutorial/02-node-output.osm.html
// requête sur l'api Overpass

/*
[“key”=“value”] : Recherche les objets ayant exactement cette clé et valeur.
[“key”~“value”] : Recherche les objets dont la clé contient la valeur spécifiée.
[“key”~“^value”] : Recherche les objets dont la clé commence par la valeur spécifiée.
[“key”~“value$”] : Recherche les objets dont la clé se termine par la valeur spécifiée.
*/

//https://stackoverflow.com/questions/60856714/how-to-use-overpass-api -> utiliser l'api

/*

const query = `
[out:json][timeout:25];
node["amenity"="college"](around:200,47.364604,0.684748);
out body;`;


// pour les clé amenity
// https://taginfo.openstreetmap.org/keys/amenity#values
// https://wiki.openstreetmap.org/wiki/FR:Key:amenity

// ici around mais possible d'autres comme bbox -> la zone visible

// pour tester des requêtes 
// https://overpass-turbo.eu/#

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

// peut-être remplacer la méthode get par Post -> risque si des requêtes trop longues

console.log(url)

fetch(url)
    .then(response => response.json())
    .then(data => {
        console.log(data);
        console.log("J'ai trouvé : ", data.elements.length , "élément");
    })
    .catch(error => {
        console.error('Erreur lors de la récupération des données :', error);
    }
);

*/