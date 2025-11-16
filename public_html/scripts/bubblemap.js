//python -m http.server 3000

import GeoService from './geoService.js';
import Geocode from './geocode.js';

async function main() {
  const dataPath = 'data/data.csv';
  const topoPath = 'data/countries-110m.json';

  // === Initialisation ===
  const geoService = new GeoService();

  let colorMode = "performance"; // Mode de coloration des bulles initiale

  //Liste des couleurs pour les différents usages
  const USAGE_COULEURS = {
    "Education": "#6282ee",
    "Social Media": "#ff7f50",
    "Gaming": "#ffa600",
    "Browsing": "#2a9d8f",
    "Other": "#999999"
  };

  const svg = d3.select('#map');
  const width = 860, height = 560;
  const projection = d3.geoMercator().scale(135).translate([width / 2, height / 2]);
  const path = d3.geoPath().projection(projection);
  const tooltip = d3.select('#tooltip');

  // === Lecture CSV ===
  const [topoData, rows] = await Promise.all([
    d3.json(topoPath),
    d3.csv(dataPath, d3.autoType)
  ]);
  d3.select('#loading').text('Données chargées — préparation...');

  const land = topojson.feature(topoData, topoData.objects.countries);
  svg.append('g')
    .selectAll('path')
    .data(land.features)
    .enter().append('path')
    .attr('d', path)
    .attr('fill', '#e9eef3')
    .attr('stroke', '#bfc9d6')
    .attr('stroke-width', 0.4);

  // === Géocodage + agrégation ===
  const cityCache = new Map();
  const cityData = [];

  d3.select('#loading').text('Géocodage des villes...');

  //Parcours de chaque ligne du CSV pour géocoder les villes
  for (const row of rows) {
    const cityName = row.Location?.trim(); // récupération du nom de la ville
    if (!cityName) continue; // ignorer si pas de nom

    let city = cityCache.get(cityName); // vérifier si la ville est déjà en cache
    if (!city) { // si pas en cache, géocoder
      let lat;
      let lon;
      let display_name = cityName;

      const geo = await geoService.getGeocodeByCity(cityName); // appel au service de géocodage
      if (geo) { // si géocodage réussi, récupérer les coordonnées
        lat = geo.lat;
        lon = geo.lon;
        display_name = geo.cityName;
      }

      city = { Location: cityName, display_name, lat: +lat, lon: +lon, samples: [] }; // créer l'objet city
      cityCache.set(cityName, city); // stockage dans le cache
      cityData.push(city); // ajouter à la liste des villes
    }
    city.samples.push(row); // ajouter les données à la ville
  }

  // Filtrer les villes sans coordonnées valides
  if (!cityData.length) {
    d3.select('#loading').text('Aucune ville avec coordonnées valides.');
    return;
  }

  // Calcul des statistiques par ville
  for (const city of cityData) {
    city.count = city.samples.length; // nombre d'échantillons
    city.avgPerformance = d3.mean(city.samples, d => d.Academic_Performance); // moyenne des performances académiques
    city.purposes = d3.rollup(city.samples, vv => vv.length, d => d.Phone_Usage_Purpose); // répartition des usages
    city.avgSleep = d3.mean(city.samples, d => d.Sleep_Hours); //Temps de sommeil moyen
  }

  d3.select('#loading').text('');

  // === Création des bulles ===
  const performance = d3.extent(cityData, d => d.avgPerformance);
  const echelleCouleur = d3.scaleLinear()
    .domain([performance[0] || 50, performance[1] || 100])
    .range(["#6282ee", "#e63946"]); //Dégradé de couleur personnalisé : BLEU -> ROUGE

  const rayon = d3.scaleSqrt()
    .domain(d3.extent(cityData.map(d => d.count)))
    .range([6, 18]);

  // === Positionnement sur la carte ===
  cityData.forEach(d => [d.x, d.y] = projection([d.lon, d.lat]));

  const bulles = svg.append('g');
  const simulation = d3.forceSimulation(cityData)
    .force('x', d3.forceX(d => d.x).strength(0.7))
    .force('y', d3.forceY(d => d.y).strength(0.7))
    .force('collision', d3.forceCollide(d => rayon(d.count) + 2))
    .stop();

  for (let i = 0; i < 120; i++) simulation.tick();

  // === Visualisation des bulles ===
  const node = bulles.selectAll('g.node').data(cityData)
    .enter().append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('cursor', 'pointer')
    .on('mouseover', (event, d) =>
      tooltip.style('display', 'block').html(
        `<strong>${d.Location}</strong><br/>Élèves : ${d.count}<br/>Moyenne : ${d.avgPerformance.toFixed(1)}<br/>`
      )
    )
    .on('mousemove', (event) =>
      tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY + 10) + 'px')
    )
    .on('mouseout', () => tooltip.style('display', 'none'))
    .on('click', (event, d) => selectCity(d.Location));

  node.append('circle') //Ajout des cercles correspondant aux villes
    .attr('r', d => rayon(d.count))
    .attr('fill', d => { 
      const purposes = Array.from(d.purposes);
      if (colorMode === "performance") {
        return echelleCouleur(d.avgPerformance);
      }
      if (!purposes.length) return "#ccc";
      const [topUsage] = purposes.sort((a, b) => b[1] - a[1])[0];
      return USAGE_COULEURS[topUsage] ?? "#ccc";
    })
    .attr('stroke', '#333')
    .attr('stroke-width', 1)
    .attr('opacity', 0.95);

  node.append('text') //Ajout des labels de villes
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .style('font-size', '10px')
    .style('pointer-events', 'none')
    .text(d => d.Location.split(' ')[0]);
  
  //Ecoute du changement du radio button pour changer le mode de couleur
  d3.selectAll('input[name="colorMode"]').on('change', () => {
    colorMode = document.querySelector('input[name="colorMode"]:checked').value;
    updateBubbleColors();
  });

  //Fonction de mise à jour des couleurs des bulles
  function updateBubbleColors() {
    node.select('circle')
      .transition().duration(250)
      .attr('fill', d => {
        if (colorMode === "performance") {
          return echelleCouleur(d.avgPerformance);
        }

        // mode usage : trouver l'usage dominant
        const purposes = Array.from(d.purposes);
        if (!purposes.length) return "#ccc";

        const [topUsage] = purposes.sort((a, b) => b[1] - a[1])[0];
        return USAGE_COULEURS[topUsage] ?? "#ccc";
      });
  }

  // === Piechart ===
  const pieW = 360, pieH = 360, pieR = Math.min(pieW, pieH) / 2 - 20;
  const pieSvg = d3.select('#pieChart').attr('viewBox', `0 0 ${pieW} ${pieH}`);
  const pies = pieSvg.append('g').attr('transform', `translate(${pieW / 2},${pieH / 2})`);
  const pie = d3.pie().value(d => d[1]).sort(null);
  const arc = d3.arc().innerRadius(0).outerRadius(pieR);

  //Fonction de sélection d'une ville
  function selectCity(location) {
    const city = cityData.find(c => c.Location === location);
    if (!city) return;
    updatePie(city);
    bulles.selectAll('circle').attr('stroke-width', d => d.Location === location ? 3.5 : 1);
    d3.select('#pieTitle').text(`Usages — ${city.Location}`);
  }

  //Fonction de mise à jour du camembert
  function updatePie(city) {
    const purposes = Array.from(city.purposes).map(([k, v]) => [k, v]);
    const total = d3.sum(purposes, d => d[1]);
    if (total === 0) {
      pies.selectAll('*').remove();
      d3.select('#pieLegend').html('Aucune donnée');
      return;
    }

    // Mise à jours des couleurs
    const usageCouleurs = d3.scaleOrdinal()
      .domain(purposes.map(d => d[0]))
      .range(purposes.map(([k]) => USAGE_COULEURS[k] ?? "#cccccc"));

    // Mise à jour des proportions des activités
    const arcs = pies.selectAll('path').data(pie(purposes));
    arcs.join(
      enter => enter.append('path')
        .attr('d', arc)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('fill', d => usageCouleurs(d.data[0]))
        .each(function (d) { this._current = d; })
        .on('mouseover', (event, d) =>
          tooltip.style('display', 'block').html(
            `<strong>${d.data[0]}</strong><br/>${d.data[1]} élèves (${(d.data[1] / total * 100).toFixed(1)}%)`
          )
        )
        .on('mousemove', (event) =>
          tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY + 10) + 'px')
        )
        .on('mouseout', () => tooltip.style('display', 'none')),
      update => update.transition().duration(350).attrTween('d', function (d) {
        const i = d3.interpolate(this._current, d);
        this._current = i(1);
        return t => arc(i(t));
      }),
      exit => exit.remove()
    );

    // Mise à jour de la légende
    const legend = d3.select('#pieLegend');
    legend.html('');

    // Informations essentiel de la bulle
    legend.append('div')
      .attr('class', 'legend-info-moyenne')
      .html(`<strong>Moyenne académique :</strong> ${city.avgPerformance.toFixed(1)}`);

    legend.append('div')
      .attr('class', 'legend-info-sleep')
      .html(`<strong>Sommeil moyen :</strong> ${city.avgSleep?.toFixed(1) || "N/A"} h`);

    purposes.forEach(p => {
      const div = legend.append('div').attr('class', 'legend-item');
      div.append('div').attr('class', 'legend-swatch').style('background', usageCouleurs(p[0]));
      div.append('div').text(`${p[0]} — ${p[1]} (${(p[1] / total * 100).toFixed(1)}%)`);
    });
  }
}

main().catch(err => {
  console.error('Erreur JS', err);
  d3.select('#loading').text('Erreur de chargement — regarde la console (F12).');
});

