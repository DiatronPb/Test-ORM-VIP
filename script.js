// Coordonnées approximatives de Polytech Tours
const LAT_POLYTECH = 47.364604;
const LNG_POLYTECH = 0.684748;


const reqllm = true;



// Initialisation de la carte centrée sur Paris
let map = L.map('map', {
    dragging: true, //glisser 
    touchZoom: true, //zoom tactile
    doubleClickZoom: false, //zoom double clic
}).setView([LAT_POLYTECH, LNG_POLYTECH], 17); // Zoom initial

// Tuile OpenStreetMap /!\ à usage policy
const maxZoom = 20
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: maxZoom,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let radiusCircle = 200 ; // rayon en px
let currentCircle = null;

let markerli = [];

let currentLoopId = 0; // éviter 2 boucles concurentes

map.on('click', async function(e) {

    const startTime = Date.now();

    //console.log(e);
    console.log("------click !!-----")
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Supprimer le cercle précédent s'il existe
    /*
    if (currentCircle) {
        map.removeLayer(currentCircle);
        currentCircle = null;
    }
    */
    currentLoopId++;
    const thisloopid = currentLoopId;

    markerli.forEach(el => {map.removeLayer(el)});
    markerli = [];

    // Ajouter un cercle à l'endroit cliqué
    currentCircle = L.circleMarker(e.latlng, {
        color: 'blue',
        fillColor: '#blue',
        fillOpacity: 0.5,
        radius: radiusCircle
    }).addTo(map);

    markerli.push(currentCircle);


    // calcul du rayon en mètre 
        // converti point géographique en coordonnées pixel
    let center = map.latLngToLayerPoint(e.latlng);
    let point = L.point(center.x + radiusCircle, center.y);
    let pointgeo = map.layerPointToLatLng(point);
    let radiusCirclem = map.distance(e.latlng, pointgeo);

    // lancement de la requête

    /*    
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
    */

    const zommte = map.getZoom();
    let queryt = "";
    if (zommte > 13){
        queryt = `
        [out:json];
        (
        node(around:${radiusCirclem},${lat},${lng});
        );
        out body;
        `;
    }
    else if (zommte > 10){
        queryt = `
        [out:json];
        (
        node["place"="city"](around:${radiusCirclem},${lat},${lng}); 
        node["place"="town"](around:${radiusCirclem},${lat},${lng}); 
        node["place"="village"](around:${radiusCirclem},${lat},${lng}); 
        );
        out body;
        `;

    }
    else if (zommte > 7){
        queryt = `
        [out:json];
        node["place"="city"](around:${radiusCirclem},${lat},${lng}); 
        out body;
        `;
    }
    else{
        queryt = `
        [out:json];
        relation["admin_level"="2"]["boundary"="administrative"];
        out body;
        `;
    }

/*
[out:json];
area["name"="Indre-et-Loire"]["admin_level"="6"]->.searchArea;
(
  node["place"="village"](area.searchArea);
  way["place"="village"](area.searchArea);
  relation["place"="village"](area.searchArea);
);
out center;

*/



    
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(queryt);

    console.log(url)

    fetch(url)

        .then(response => {
            if (response.ok){
                return response.json()
            }
            else{
                throw new Error(`Erreur HTTP : ${response.status}`)
            }
        })
        .then(async data => {
            console.log(data);
            let datafiltered = data.elements.filter(el => {return el.tags && Object.keys(el.tags).length > maxZoom - map.getZoom()});
            //console.log(datafiltered);
            console.log(`J'ai trouvé : ${data.elements.length} élément(s)`);

            console.log(`J'ai trouvé : ${Object.keys(datafiltered).length} élément(s) après filtre`);

            datafiltered.forEach(el => {
                markerli.push(
                    L.circleMarker([el.lat, el.lon], {
                    color: 'red',
                    fillColor: 'red',
                    fillOpacity: 0.5,
                    radius: 5
                    }).addTo(map)
                );

                //console.log(el);
                //arnaque pour API -> utilise IIFE 
                /*
                if (token_hf){
                    (async () => {
                        const rep = await generateDesc(datafiltered[0].tags);
                        console.log(rep);
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    })();
                }
                */


            })
            console.log(datafiltered);
            if (reqllm){
                try{
                    console.log("appel llm");
                    const datasimple = datafiltered.map(el => {return Object.entries(el.tags).map(([k, v]) => {`${k} : ${v}`})});

                    const rep = await generateDesc(datasimple);
                    const cleaned = rep.replace(/```json|```/g, '').trim();
                    const parsed = JSON.parse(cleaned);
                    console.log(parsed);
                }catch(err){
                    console.log("Erreur LLM :", err);
                }
                
                // trier ce qu'on envoie
                /*
                generateDesc(datafiltered).then(rep => {
                    const cleaned = rep.replace(/```json|```/g,'').trim();
                    const parsed = JSON.parse(cleaned)
                    console.log(parsed);
                });
                */


            }

            //console.log(markerli);
            const endtime = Date.now();
            console.log(`Temps écoulé : ${((endtime - startTime) / 1000).toFixed(2)} s`);

            // à adapter avec le json récupérer quand j'aurai trouvé une solution pour le llm
            if (zommte > 7){
                let cpt = 0;
                while (cpt < datafiltered.length){
                    //console.log(cpt);
                    if (currentLoopId != thisloopid) break;
                    const nodedesc = Object.entries(datafiltered[cpt].tags).map(([key, value]) => `${key} : ${value}`).join("<br>");
                    //console.log(nodedesc);
                    let marker = markerli[cpt+1];
                    marker.bindPopup(nodedesc);
                    marker.openPopup();

                    document.getElementById("nvda-reader").innerHTML = nodedesc;
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    marker.closePopup();
                    marker.setStyle({
                        color : "green",
                        fillColor : "green"
                    });
                    cpt ++;

                }
            }

            

        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données :', error);
        }
    );
    

    
});

map.on('zoomstart', () => {
    markerli.forEach(el => {map.removeLayer(el)});
    currentLoopId++;
    console.log(map.getZoom())
});


// const token_hf = ProcessingInstruction.env.HF_TOKEN;
//asyn -> pour utiliser await au lieu de .then

async function generateDesc(dat){


    const prompt = `Voicie les tags OSM : ${JSON.stringify(dat)} sous la forme d'un JSON avec en clé leur id, qui ont tous leurs propres tags. Renvoie uniquement un objet JSON, sans texte autour, sans balise Markdown, sous la forme clé = id dans le tableau (0, 1, ...), valeur = une phrase très courte, 
    compréhensible par un lecteur d'écran des tags du point d'intérêt
    Ne mets rien d'autre que le JSON dans ta réponse seulement le format
    {
        "0" : "phrase courte",
        ...
    }`
    ;
    try {
        const response = await fetch("http://127.0.0.1:3000/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "mistral-7b-instruct-v0.1.Q4_0.gguf",
            messages: [
                { 
                    role: "system",
                    content: "Tu es un assistant qui transforme des tags OSM en phrases très courtes pour un lecteur d'écran." 
                },
                { 
                    role: "user", 
                    content: prompt 
                }
                ]
            })
        });

        console.log("Requête envoyée, réponse reçue");

        const data = await response.json();
        console.log(data);
        return data.choices[0].message.content; 
        } 
    catch (err) {
            console.log("Erreur dans generatedesc :", err);
            return "erreur llm";
    }
}


/*
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
        "Authorization": `Bearer ${token_hf}`, // OK en local
        "Content-Type": "application/json"
        },
        body: JSON.stringify({
            // deepseek-ai/DeepSeek-V3-0324
            model: "HuggingFaceTB/SmolLM3-3B:hf-inference",
            messages: [
                { role: "system", content: "Tu es un assistant qui transforme des tags OSM en phrases très courtes pour un lecteur d'écran." },
                { role: "user", content: prompt }
            ]
        })
    });
*/






































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