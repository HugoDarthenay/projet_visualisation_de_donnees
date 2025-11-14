const margin = { top: 60, right: 40, bottom: 80, left: 80 },
      width = 900 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;
const svg = d3.select("#visualisation")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
const gDots = svg.append("g").attr("class", "points");
const tooltip = d3.select("#tooltip");

const colorScale = d3.scaleLinear()
    .domain([0, 2.5])
    .range(["#edededff", "#6282eeff"]); // Gris très clair → Bleu
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const sizeScaleRed = d3.scaleLinear().range([5, 25]);
const sizeScaleWhite = d3.scaleLinear().range([0, 0.9]);
let fullData = [];






// 1. Légende de dégradé de couleur - CORRECTION COMPLÈTE
function addColorLegend() {
    // ========== DIMENSIONS DE LA LÉGENDE ==========
    // Modifier ces valeurs pour changer la taille de la légende
    const legendWidth = 180;   // Largeur de la barre de légende
    const legendHeight = 10;   // Hauteur de la barre de légende
    
    // ========== POSITION DE LA LÉGENDE ==========
    // Modifier ces valeurs pour déplacer la légende
    const legendSvg = svg.append("g")
        .attr("class", "color-legend")
        .attr("transform", `translate(${width - legendWidth - 30}, ${-30})`);
        // ↑ Position horizontale: width - legendWidth - 30 (décalage depuis la droite)
        // ↑ Position verticale: -50 (décalage depuis le haut)

    // ========== CRÉATION DU DÉGRADÉ ==========
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient");

    // ========== COULEURS DU DÉGRADÉ ==========
    // Modifier ces valeurs pour changer les couleurs de la légende
    linearGradient.selectAll("stop")
        .data([
            { offset: "0%", color: colorScale(0) },      // Couleur de départ
            { offset: "100%", color: colorScale(2.5) }   // Couleur de fin
        ])
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    // ========== RECTANGLE AVEC DÉGRADÉ ==========
    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    // ========== ÉCHELLE DE LA LÉGENDE ==========
    // Modifier le domaine pour changer les valeurs affichées
    const legendScale = d3.scaleLinear()
        .domain([0, 2.5])           // Valeurs min et max affichées
        .range([0, legendWidth]);   // Correspondance avec la largeur

    // ========== AXE DE LA LÉGENDE ==========
    const legendAxis = d3.axisBottom(legendScale)
        .ticks(7)                   // Nombre de graduations
        .tickSize(legendHeight);    // Taille des ticks

    // Groupe pour l'axe
    const axisGroup = legendSvg.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)  // Position de l'axe sous le rectangle
        .call(legendAxis);

    // ========== TITRE DE LA LÉGENDE ==========
    // Modifier ces valeurs pour personnaliser le titre
    legendSvg.append("text")
        .attr("x", legendWidth / 2)       // Position horizontale (centré)
        .attr("y", -5)                   // Position verticale (au-dessus de la légende)
        .attr("text-anchor", "middle")    // Alignement du texte
        .attr("font-size", "11px")        // Taille de police
        .attr("fill", "#333")             // Couleur du texte
        .text("Temps plateforme éducative (heures)");  // ← TEXTE À MODIFIER ICI
}

// 2. Légende pour les tailles de cercles bleus
function createSizeLegendRed() {
    const sizeLegend = d3.select("#size-circles-red");
    const sizes = [2, 4, 8];
    const labels = ["Faible", "Moyen", "Élevé"];
    
    const sizeSvg = sizeLegend.append("svg")
        .attr("width", 150)
        .attr("height", 100);
    
    sizeSvg.selectAll(".size-legend-item")
        .data(sizes)
        .enter()
        .append("g")
        .attr("class", "size-legend-item")
        .attr("transform", (d, i) => `translate(30, ${25 + i * 25})`)
        .each(function(d, i) {
            const g = d3.select(this);
            
            g.append("circle")
                .attr("class", "size-legend-circle red")
                .attr("r", d)
                .attr("cx", 0)
                .attr("fill", "#6282eeff")
                
            g.append("text")
                .attr("class", "size-legend-label")
                .attr("x", d + 15)
                .attr("y", 5)
                .text(labels[i]);
        });
}

// 3. Légende pour les tailles de cercles gris (gris très clair)
function createSizeLegendWhite() {
    const sizeLegend = d3.select("#size-circles-white");
    const sizes = [2, 4, 8];
    const labels = ["Faible", "Moyen", "Élevé"];
    
    const sizeSvg = sizeLegend.append("svg")
        .attr("width", 150)
        .attr("height", 100);
    
    sizeSvg.selectAll(".size-legend-item")
        .data(sizes)
        .enter()
        .append("g")
        .attr("class", "size-legend-item")
        .attr("transform", (d, i) => `translate(30, ${25 + i * 25})`)
        .each(function(d, i) {
            const g = d3.select(this);
            
            g.append("circle")
                .attr("class", "size-legend-circle white")
                .attr("r", d)
                .attr("cx", 0)
                .attr("fill", "#dededeff") // Gris très clair
                .attr("stroke", "#dededeff") 
                .attr("stroke-width", 0.5);
                
            g.append("text")
                .attr("class", "size-legend-label")
                .attr("x", d + 15)
                .attr("y", 5)
                .text(labels[i]);
        });
}

// Fonction pour dessiner les axes
function drawAxes() {
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
      .append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "#000")
        .style("text-anchor", "middle")
        .text("Performance Académique (%)");

    svg.append("g")
        .call(d3.axisLeft(yScale))
      .append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("fill", "#000")
        .style("text-anchor", "middle")
        .text("Temps d'Écran Quotidien (heures)");
}

// Fonction pour créer le scatter plot
function createScatterPlot(data) {
    const points = gDots.selectAll(".data-point")
        .data(data, d => d.ID)
        .join(
            enter => {
                const group = enter.append("g")
                    .attr("class", "data-point");

                // Cercle extérieur coloré - AVEC STROKE NOIR
                group.append("circle")
                    .attr("class", "outer-circle")
                    .attr("cx", d => xScale(d.Academic_Performance))
                    .attr("cy", d => yScale(d.Daily_Usage_Hours))
                    .attr("r", 0)
                    .attr("fill", d => colorScale(d.Time_on_Education))
                    .attr("fill-opacity", 0.8)
                    .attr("stroke", "#333") // Stroke noir ajouté
                    .attr("stroke-width", 1)
                    .call(enter => enter.transition().duration(500).attr("r", d => sizeScaleRed(d.Daily_Usage_Hours)));

                // Cercle intérieur gris très clair - SANS STROKE
                group.append("circle")
                    .attr("class", "inner-circle")
                    .attr("cx", d => xScale(d.Academic_Performance))
                    .attr("cy", d => yScale(d.Daily_Usage_Hours))
                    .attr("r", 0)
                    .attr("fill", "#dededeff") // Gris très clair
                    // Pas de stroke pour le cercle intérieur (par défaut dans ce cas)
                    .call(enter => enter.transition().duration(500).attr("r", d => sizeScaleRed(d.Daily_Usage_Hours) * sizeScaleWhite(d.Anxiety_Level)));

                // Événements pour le tooltip
                group.on("mouseover", function(event, d) {
                    tooltip
                        .style("opacity", 1)
                        .html(`
                            <h4>${d.Name}</h4>
                            <p><strong>Activité principale:</strong> ${d.Phone_Usage_Purpose}</p>
                            <p><strong>Temps d'écran total:</strong> ${d.Daily_Usage_Hours}h</p>
                            <p><strong>Performance:</strong> ${d.Academic_Performance}%</p>
                        `)
                        .style("left", (event.pageX - 500) + "px")
                        .style("top", (event.pageY - 50) + "px");
                })
                .on("mousemove", function(event) {
                    tooltip
                        .style("left", (event.pageX - 500) + "px")
                        .style("top", (event.pageY - 100) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                });

                return group;
            },
            update => update,
            exit => exit.transition().duration(500).select(".outer-circle").attr("r", 0).remove()
        );
}

// Initialisation des filtres
function initializeFilters(data) {
    const grades = Array.from(new Set(data.map(d => d.School_Grade))).sort((a, b) => +a - +b);
    const gradeSelect = d3.select(".grade-select");

    gradeSelect.selectAll("option:not([value='all'])").remove();

    gradeSelect.selectAll("option.grade-option")
        .data(grades.filter(d => d && d !== 'undefined' && d !== 'null'))
        .enter().append("option")
        .attr("class", "grade-option")
        .attr("value", d => d)
        .text(d => `Grade ${d}`);
    
    const purposes = Array.from(new Set(data.map(d => d.Phone_Usage_Purpose))).sort();
    const purposeSelect = d3.select(".purpose-select");

    purposeSelect.selectAll("option:not([value='all'])").remove();

    purposeSelect.selectAll("option.purpose-option")
        .data(purposes)
        .enter().append("option")
        .attr("class", "purpose-option")
        .attr("value", d => d)
        .text(d => d);
}

// Filtrage des données
function filterData() {
    const selectedGrade = d3.select(".grade-select").property("value");
    const selectedPurpose = d3.select(".purpose-select").property("value");
    
    gDots.selectAll(".data-point")
        .transition()
        .duration(300)
        .style("display", function(d) {
            const gradeMatch = selectedGrade === "all" || d.School_Grade == selectedGrade;
            const purposeMatch = selectedPurpose === "all" || d.Phone_Usage_Purpose === selectedPurpose;
            return (gradeMatch && purposeMatch) ? "block" : "none";
        });
}

// Lancement des légendes
createSizeLegendRed();
createSizeLegendWhite();

// Chargement des données
d3.csv("./data/data.csv").then(function(data) {
    const limited_data = data.slice(0, 100);
    limited_data.forEach(d => {
        d.Time_on_Education = +d.Time_on_Education;
        d.Daily_Usage_Hours = +d.Daily_Usage_Hours;
        d.Anxiety_Level = +d.Anxiety_Level;
        d.Academic_Performance = +d.Academic_Performance;
        d.School_Grade = String(d.School_Grade);
    });

    fullData = limited_data;

    xScale.domain([40, 100]);
    yScale.domain([d3.min(limited_data, d => d.Daily_Usage_Hours) * 0.9, 
                   d3.max(limited_data, d => d.Daily_Usage_Hours) * 1.05]).nice();
    
    sizeScaleRed.domain([0, d3.max(limited_data, d => d.Daily_Usage_Hours)]);
    sizeScaleWhite.domain([0, d3.max(limited_data, d => d.Anxiety_Level)]);

    drawAxes();
    addColorLegend(); // ← UNE SEULE FOIS ici
    createScatterPlot(limited_data);
    initializeFilters(limited_data);
    
    d3.select(".grade-select").on("change", filterData);
    d3.select(".purpose-select").on("change", filterData);
        
}).catch(function(error) {
    console.error("Erreur de chargement des données:", error);
});
