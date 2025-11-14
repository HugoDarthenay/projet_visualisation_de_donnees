// Dimension du svg 
const margin = {
    top:100, right:30,bottom:40,left:100
},
width = 1200 - margin.left - margin.right,
height = 700 - margin.top - margin.bottom;

// Création du svg (responsive avec viewBox)
const svg = d3.select("#visualisation")
    .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .style("width", "100%")
        .style("height", "auto")
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

// Création des éléments du tableau (points et bulle)
const groupePoints = svg.append("g").attr("class", "points");
const infoBulle = d3.select("#infoBulle");

// Choix des couleurs de la légende
const colorScale = d3.scaleLinear()
    .domain([0,2.5])
    .range(["#edededff", "#542fe8ff"]);


// Limites des coordonnées du tableau
// Abscisse entre 0 et la taille du tableau (max)
const xScale = d3.scaleLinear().range([0,width]);
// Ordonnée entre 0 et la hauteur du tableau (max)
const yScale = d3.scaleLinear().range([height, 0]);
// Echelles des points (intérieur extérieur)
const point = d3.scaleLinear().range([5,25]);
const inPoint = d3.scaleLinear().range([0,0.9]);
let fullData = [];


// Fonction de création de la légende (dégradé de couleur)
function createColoredScale(){
    const legendWidth = 200;
    const legendHeight = 10;

    // Déplacement de la légende
    const legendSvg = svg.append("g")
        .attr("class", "colored-legend")
        .attr("transform", `translate(${width - legendWidth - 30}, ${-30})`);

    // Création du dégradé
    const defs = d3.select("#visualisation").select("svg").select("defs").empty()
        ? d3.select("#visualisation").select("svg").append("defs")
        : d3.select("#visualisation").select("svg").select("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient");
    // Echelle de la légende (0 à 2.5)
    linearGradient.selectAll("stop")
        .data([
            {
                offset : "0%", color : colorScale(0)
            },
            {
                offset : "100%", color : colorScale(2.5)
            }
        ])
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d=>d.color);
    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");
    const legendScale = d3.scaleLinear()
        .domain([0,2.5])
        .range([0, legendWidth]);
    const legendAxis = d3.axisBottom(legendScale)
        .ticks(7)
        .tickSize(legendHeight);
    const axisGroup = legendSvg.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);
    
    legendSvg.append("text")
        .attr("x", legendWidth/2)
        .attr("y",-5)
        .attr("text-anchor", "middle")
        .attr("font-size", "0.7vw")
        .attr("fill","#333")
        .text("Temps passé sur les plateformes éducatives (heures)");
}

// Création de cercles pour la légende des heures d'écran
function createLegendNbHeures(){
    const sizeLegend = d3.select("#legende_nb_heures");
    const sizes = [2,4,8];
    const labels = ["Faible", "Moyen", "Elevé"];
    const sizeSvg = sizeLegend.append("svg")
        .attr("width", 150)
        .attr("height", 100);

    sizeSvg.selectAll("g")
        .data(sizes)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(30, ${30 + i * 30})`)
        .each(function(d, i) {
            const g = d3.select(this);
            
            g.append("circle")
                .attr("class", "cercle_nb_heures")
                .attr("r", d)
                .attr("cx", 0)
                .attr("fill", "#542fe8ff")
                
            g.append("text")
                .attr("class", "label_cercle_nb_heures")
                .attr("x", d + 15)
                .attr("y", 5)
                .attr("fill", "#000000ff")
                .text(labels[i]);
        });
}

// Création de cercles pour le niveau d'anxiété
function createLegendAnxiete(){
    const sizeLegend = d3.select("#legende_niveau_anxiete");
    const sizes = [2,4,8];
    const labels = ["Faible", "Moyen", "Elevé"];
    const sizeSvg = sizeLegend.append("svg")
        .attr("width", 150)
        .attr("height", 100);

    sizeSvg.selectAll("g")
        .data(sizes)
        .enter()
        .append("g")
        .attr("class", "size-legend-item")
        .attr("transform", (d, i) => `translate(30, ${30 + i * 30})`)
        .each(function(d, i) {
            const g = d3.select(this);
            
            g.append("circle")
                .attr("class", "cercle_anxiete")
                .attr("r", d)
                .attr("cx", 0)
                .attr("fill", "#ccccccff")
                .attr("stroke-width", 0.5);

            g.append("text")
                .attr("class", "label_cercle_anxiete")
                .attr("x", d + 15)
                .attr("y", 5)
                .attr("fill", "#000000ff")
                .text(labels[i]);
        });
}

// Création des labels sur les axes du tableau
function drawAxes(){
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
    .append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", 40)
        .style("text-anchor","middle")
        .text("Performance académique");

    svg.append("g")
        .call(d3.axisLeft(yScale))
    .append("text")
        .attr("class", "axis-label")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("transform", "rotate(-90)")
        .style("text-anchor","middle")
        .text("Temps d'écran quotidien (heures)");
}

// Fonction de création des éléments du tableau (points, bulles)
function createScatterPlot(data){
    const points = groupePoints.selectAll(".points_data")
        .data(data, d => d.Name)
        .join(
            enter => {
                const group = enter.append("g")
                    .attr("class", "points_data")
                    .style("opacity", 0);
                group.transition().duration(500).style("opacity", 1);
                
                group.append("circle")
                    .attr("class","circle")
                    .attr("cx", d => xScale(d.Academic_Performance))
                    .attr("cy", d => yScale(d.Daily_Usage_Hours))
                    .attr("r",0)
                    .attr("fill", d => colorScale(d.Time_on_Education))
                    .attr("fill-opacity", 0.8)
                    .attr("stroke", "#464646ff")
                    .attr("stroke-width", 1)
                    .call(enter => enter.transition().duration(500).attr("r", d=>point(d.Daily_Usage_Hours)));

                group.append("circle")
                    .attr("class", "inner_circle")
                    .attr("cx", d => xScale(d.Academic_Performance))
                    .attr("cy", d => yScale(d.Daily_Usage_Hours))
                    .attr("r", 0)
                    .attr("fill-opacity", 0.8)
                    .attr("fill", "#ccccccff") 
                    .call(enter => enter.transition().duration(500)
                        .attr("r", d => point(d.Daily_Usage_Hours) * inPoint(d.Anxiety_Level)));

                // Ajout des interactions pour l'infobulle
                group.on("mouseover", function(event, d) {
                    infoBulle
                        .style("opacity", 1)
                        .html(`
                            <h4 style="margin:0 0 6px 0;">${d.Name}</h4>
                            <div>
                              <p><strong>Activité principale :</strong> ${d.Phone_Usage_Purpose}</p>
                              <p><strong>Temps d'écran :</strong> ${d.Daily_Usage_Hours} heures</p>
                              <p><strong>Performance académique :</strong> ${d.Academic_Performance}/100</p>
                            </div>
                        `);
                    // Positionnement de l'infobulle
                    const visNode = d3.select("#visualisation").node();
                    const ttNode = infoBulle.node();
                    if (!ttNode) return;
                    const visRect = visNode ? visNode.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
                    const ttRect = ttNode.getBoundingClientRect();
                    const x = event.clientX - visRect.left;
                    let left = x - ttRect.width / 2;
                    const maxLeft = (typeof visRect.width === 'number') ? (visRect.width - ttRect.width - 4) : (window.innerWidth - ttRect.width - 4);
                    left = Math.max(4, Math.min(left, maxLeft));
                    const y = event.clientY - visRect.top;
                    const top = y + 8;
                    infoBulle.style("left", left + "px").style("top", top + "px");
                })
                .on("mousemove", function(event) {
                    const visNode = d3.select("#visualisation").node();
                    const ttNode = infoBulle.node();
                    if (!ttNode) return;
                    const visRect = visNode ? visNode.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
                    const ttRect = ttNode.getBoundingClientRect();
                    const x = event.clientX - visRect.left;
                    let left = x - ttRect.width / 2;
                    const maxLeft = (typeof visRect.width === 'number') ? (visRect.width - ttRect.width - 4) : (window.innerWidth - ttRect.width - 4);
                    left = Math.max(4, Math.min(left, maxLeft));
                    const y = event.clientY - visRect.top;
                    const top = y + 8;
                    infoBulle.style("left", left + "px").style("top", top + "px");
                })
                .on("mouseout", function() {
                    infoBulle.style("opacity", 0);
                });

                return group;
            },
            update => update,
            exit => exit.transition().duration(500).style("opacity", 0).remove()
        );
}

// Fonction de création des filtres de tri
function initializeFilters(data){
    const grades = Array.from(new Set(data.map(d => d.School_Grade))).sort((a, b) => +a - +b);
    const gradeSelect = d3.select(".grade_select");
    gradeSelect.selectAll("option:not([value='all'])").remove();
    gradeSelect.selectAll("option.grade_option")
        .data(grades.filter(d => d && d !== 'undefined' && d !== 'null'))
        .enter().append("option")
        .attr("class", "grade_option")
        .attr("value", d => d)
        .text(d => `Grade ${d}`);
    
    const purposes = Array.from(new Set(data.map(d => d.Phone_Usage_Purpose))).sort();
    const purposeSelect = d3.select(".purpose_select");

    purposeSelect.selectAll("option:not([value='all'])").remove();
    purposeSelect.selectAll("option.purpose-option")
        .data(purposes)
        .enter().append("option")
        .attr("class", "purpose-option")
        .attr("value", d => d)
        .text(d => d);
}

// Filtre graduel anxiété
function createFilterAnxiete() {
    const values = fullData.map(d => +d.Anxiety_Level).filter(v => !isNaN(v));
    if (values.length === 0) return;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const container = d3.select('#legende_niveau_anxiete');
    const wrap = container.append('div').attr('class', 'filtre_anxiete').style('margin-top','10px');

    wrap.append('label').text('Filtrer niveau d\'anxiété :')
    const controls = wrap.append('div')
        .attr('class', 'controls')

    // création des deux sliders
    controls.append('input')
        .attr('type','range')
        .attr('id','anxiety-min')
        .attr('min',min)
        .attr('max',max)
        .attr('step', Math.max((max-min)/100, 0.1))
        .property('value', min);

    controls.append('input')
        .attr('type','range')
        .attr('id','anxiety-max')
        .attr('min',min)
        .attr('max',max)
        .attr('step', Math.max((max-min)/100, 0.1))
        .property('value', max);

    // affichage des valeurs min et max
    const display = wrap.append('div')
        .attr('class', 'minmax-container')
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('margin-top', '5px');

    const minGroup = display.append('div')
        .attr('class', 'min-group');
    minGroup.append('span')
        .attr('class', 'label-min')
        .text('Min: ');
    minGroup.append('span')
        .attr('id', 'anx-display-min')
        .text(min.toFixed(1));
    minGroup.append('span')
    .attr('class', 'label-min')
    .text(' /10');

    const maxGroup = display.append('div')
        .attr('class', 'max-group');
    maxGroup.append('span')
        .attr('class', 'label-max')
        .text('Max: ');
    maxGroup.append('span')
        .attr('id', 'anx-display-max')
        .text(max.toFixed(1));
    maxGroup.append('span')
    .attr('class', 'label-max')
    .text(' /10');

    // ensure min <= max
    function onChange() {
        let a = +d3.select('#anxiety-min').property('value');
        let b = +d3.select('#anxiety-max').property('value');
        if (a > b) {
            // swap to keep consistent
            const tmp = a; a = b; b = tmp;
            d3.select('#anxiety-min').property('value', a);
            d3.select('#anxiety-max').property('value', b);
        }
        d3.select('#anx-display-min').text(a.toFixed(1));
        d3.select('#anx-display-max').text(b.toFixed(1));
        filterData();
    }

    d3.selectAll('#anxiety-min, #anxiety-max').on('input', onChange);
}
// Filtre graduel heures d'utilisation
function createFilterNbHeures() {
    const values = fullData.map(d => +d.Daily_Usage_Hours).filter(v => !isNaN(v));
    if (values.length === 0) return;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const container = d3.select('#legende_nb_heures');
    const wrap = container.append('div')
        .attr('class', 'filtre_heures')
        .style('margin-top', '10px');

    wrap.append('label')
        .text('Filtrer heures quotidiennes :')
        .style('display', 'block')
        .style('font-size', '0.9em');

    const controls = wrap.append('div')
        .attr('class', 'controls');

    controls.append('input')
        .attr('type', 'range')
        .attr('id', 'hours-min')
        .attr('min', min)
        .attr('max', max)
        .attr('step', Math.max((max-min)/100, 0.1))
        .property('value', min);

    controls.append('input')
        .attr('type', 'range')
        .attr('id', 'hours-max')
        .attr('min', min)
        .attr('max', max)
        .attr('step', Math.max((max-min)/100, 0.1))
        .property('value', max);

    const display = wrap.append('div')
        .attr('class', 'minmax-container')
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('margin-top', '5px');

    const minGroup = display.append('div')
        .attr('class', 'min-group');
    minGroup.append('span')
        .attr('class', 'label-min')
        .text('Min: ');
    minGroup.append('span')
        .attr('id', 'hours-display-min')
        .text(min.toFixed(1));

    const maxGroup = display.append('div')
        .attr('class', 'max-group');
    maxGroup.append('span')
        .attr('class', 'label-max')
        .text('Max: ');
    maxGroup.append('span')
        .attr('id', 'hours-display-max')
        .text(max.toFixed(1));

    function onChange() {
        let a = +d3.select('#hours-min').property('value');
        let b = +d3.select('#hours-max').property('value');
        if (a > b) {
            const tmp = a; a = b; b = tmp;
            d3.select('#hours-min').property('value', a);
            d3.select('#hours-max').property('value', b);
        }
        d3.select('#hours-display-min').text(a.toFixed(1));
        d3.select('#hours-display-max').text(b.toFixed(1));
        filterData();
    }

    d3.selectAll('#hours-min, #hours-max').on('input', onChange);
}

// Fonction d'application des filtres crées
function filterData() {
    const selectedGrade = d3.select(".grade_select").property("value");
    const selectedPurpose = d3.select(".purpose_select").property("value");
    // debug
    console.log("filterData ->", selectedGrade, selectedPurpose);

    const groups = groupePoints.selectAll(".points_data");
    console.log("groups count:", groups.size());
    // read slider values if present
    const anxietyMinEl = d3.select('#anxiety-min');
    const anxietyMaxEl = d3.select('#anxiety-max');
    const hoursMinEl = d3.select('#hours-min');
    const hoursMaxEl = d3.select('#hours-max');

    const anxietyMin = anxietyMinEl.empty() ? -Infinity : +anxietyMinEl.property('value');
    const anxietyMax = anxietyMaxEl.empty() ? Infinity : +anxietyMaxEl.property('value');
    const hoursMin = hoursMinEl.empty() ? -Infinity : +hoursMinEl.property('value');
    const hoursMax = hoursMaxEl.empty() ? Infinity : +hoursMaxEl.property('value');

    groups.each(function(d, i) {
        const el = d3.select(this);
    const gradeMatch = selectedGrade === "all" || d.School_Grade == selectedGrade;
    const purposeMatch = selectedPurpose === "all" || d.Phone_Usage_Purpose === selectedPurpose;
    const anxietyMatch = d.Anxiety_Level >= anxietyMin && d.Anxiety_Level <= anxietyMax;
    const hoursMatch = d.Daily_Usage_Hours >= hoursMin && d.Daily_Usage_Hours <= hoursMax;
    const isVisible = gradeMatch && purposeMatch && anxietyMatch && hoursMatch;

        // stop any running transitions
        el.interrupt();

        if (isVisible) {
            // ensure visible before fading in
            el.style("display", null).style("pointer-events", "all");
            // if currently fully transparent, set to 0 then fade to 1
            const cur = parseFloat(el.style("opacity"));
            if (isNaN(cur) || cur === 0) el.style("opacity", 0);
            el.transition().duration(800).style("opacity", 1);
        } else {
            // fade out then hide and disable pointer-events
            el.transition().duration(800).style("opacity", 0).on("end", function() {
                d3.select(this).style("display", "none").style("pointer-events", "none");
            });
        }
    });
    // update average display after filtering
    updateAveragePerformance();
}

// Compute and display the mean Academic_Performance for currently-visible points
function updateAveragePerformance() {
    const selectedGrade = d3.select(".grade_select").property("value");
    const selectedPurpose = d3.select(".purpose_select").property("value");
    // respect sliders as well
    const anxietyMinEl = d3.select('#anxiety-min');
    const anxietyMaxEl = d3.select('#anxiety-max');
    const hoursMinEl = d3.select('#hours-min');
    const hoursMaxEl = d3.select('#hours-max');

    const anxietyMin = anxietyMinEl.empty() ? -Infinity : +anxietyMinEl.property('value');
    const anxietyMax = anxietyMaxEl.empty() ? Infinity : +anxietyMaxEl.property('value');
    const hoursMin = hoursMinEl.empty() ? -Infinity : +hoursMinEl.property('value');
    const hoursMax = hoursMaxEl.empty() ? Infinity : +hoursMaxEl.property('value');

    const filtered = fullData.filter(d => {
        const gradeMatch = selectedGrade === "all" || d.School_Grade == selectedGrade;
        const purposeMatch = selectedPurpose === "all" || d.Phone_Usage_Purpose === selectedPurpose;
        const anxietyMatch = d.Anxiety_Level >= anxietyMin && d.Anxiety_Level <= anxietyMax;
        const hoursMatch = d.Daily_Usage_Hours >= hoursMin && d.Daily_Usage_Hours <= hoursMax;
        return gradeMatch && purposeMatch && anxietyMatch && hoursMatch;
    });

    const avgEl = d3.select('#avg-performance');
    const actEl = d3.select('#avg-activity');

    if (!avgEl.empty() && !actEl.empty()) {
        if (filtered.length === 0) {
            avgEl.text('—');
            actEl.text('—');
        } else {
            // Calcul de la moyenne de performance
            const sum = filtered.reduce((s, v) => s + (Number(v.Academic_Performance) || 0), 0);
            const mean = sum / filtered.length;
            avgEl.text(mean.toFixed(1) + ' %');

            // Calcul de l'activité la plus fréquente
            const activityCount = {};
            filtered.forEach(d => {
                activityCount[d.Phone_Usage_Purpose] = (activityCount[d.Phone_Usage_Purpose] || 0) + 1;
            });
            
            const mostFrequent = Object.entries(activityCount)
                .sort((a, b) => b[1] - a[1])[0];
            
            actEl.text(`${mostFrequent[0]} (${((mostFrequent[1] / filtered.length) * 100).toFixed(1)}%)`);
        }
    }
}
// Affichage des légendes du scatterPlot
createLegendAnxiete();
createLegendNbHeures();

// Chargement des données
d3.csv("./data/data.csv").then(function(data) {
    const limited_data = data.slice(0, 200);
    
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
    
    point.domain([0, d3.max(limited_data, d => d.Daily_Usage_Hours)]);
    inPoint.domain([0, d3.max(limited_data, d => d.Anxiety_Level)]);

    drawAxes();
    createColoredScale();
    createScatterPlot(limited_data);
    initializeFilters(limited_data);
    createFilterAnxiete();
    createFilterNbHeures();
    
    // Ajouter cette ligne pour calculer et afficher la moyenne initiale
    updateAveragePerformance();
    
    d3.select(".grade_select").on("change", filterData);
    d3.select(".purpose_select").on("change", filterData);
        
}).catch(function(error) {
    console.error("Erreur de chargement des données:", error);
});