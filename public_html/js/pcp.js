// script.js - corrected: age filter reinstated, purpose filter, brushes fixed, colors fixed, axis labels shown
const CSV_FILE = "data/data.csv";

// dims used in axes (Age intentionally excluded from axes but still filterable)
const ALL_DIMS = [
    "Sleep_Hours",
    "Screen_Time_Before_Bed",
    "Daily_Usage_Hours",
    "Phone_Checks_Per_Day",
    "Weekend_Usage_Hours",
    "Exercise_Hours",
    "Anxiety_Level",
    "Depression_Level",
    "Addiction_Level",
    "Academic_Performance"
];

// UI
const purposeFilter = document.getElementById("purposeFilter");
const ageFilter = document.getElementById("ageFilter");
const addFilter = document.getElementById("addFilter");
const colorSelect = document.getElementById("colorSelect");
const resetBtn = document.getElementById("resetBtn");
const legendDiv = d3.select("#legend");
const tooltip = d3.select("#tooltip");

// layout & scales
const axisSpacing = 160;
const svgHeight = 560;
let svgWidth;
let svg, innerG;
let xScale;
let yScales = {};

// data
let fullData = [];
let displayData = [];
let dims = ALL_DIMS.slice(); // dims currently shown as axes

// brushes state
const activeBrushes = new Map();

// helper: parse numbers safe
function toNum(v){ const n = +v; return isNaN(n) ? null : n; }

// load CSV
d3.csv(CSV_FILE).then(raw => {
    // normalize rows: parse numeric fields, keep Name & Phone_Usage_Purpose
    fullData = raw.map(d => {
        const out = {};
        ALL_DIMS.forEach(k => out[k] = d[k] !== undefined ? toNum(d[k]) : null);
        out.Name = d.Name || d.name || "";
        // try multiple possible names for purpose to be robust
        out.Phone_Usage_Purpose = d.Phone_Usage_Purpose || d.Purpose || d.PhoneUsagePurpose || d["Phone Usage"] || "";
        out.Age = d.Age !== undefined ? toNum(d.Age) : null;
        return out;
    });

    // populate purpose dropdown
    const purposes = Array.from(new Set(fullData.map(d => d.Phone_Usage_Purpose).filter(Boolean))).sort();
    purposes.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p; opt.textContent = p;
        purposeFilter.appendChild(opt);
    });

    initPlot(); // initial draw
    bindUI();
}).catch(err => {
    console.error("Erreur lecture CSV:", err);
    d3.select("#chart-scroll").append("div").text("Erreur chargement CSV : " + err.message);
});

// initialize plotting (sample 5%)
function initPlot() {
    const pct = 0.02;
    const n = Math.max(5, Math.floor(fullData.length * pct));
    displayData = d3.shuffle(fullData.slice()).slice(0, n);

    dims = ALL_DIMS.slice(); // reset dims (Age not in axes by design)

    // compute svg width based on number of axes
    svgWidth = Math.max(900, dims.length * axisSpacing);

    // create or reset svg
    d3.select("#chart-scroll").selectAll("svg").remove();
    svg = d3.select("#chart-scroll").append("svg").attr("width", svgWidth).attr("height", svgHeight);
    innerG = svg.append("g").attr("transform", "translate(60,20)");

    // x scale (point)
    xScale = d3.scalePoint().domain(dims).range([0, (dims.length - 1) * axisSpacing]).padding(0.5);

    // y scales per dim
    yScales = {};
    dims.forEach(dim => {
        const vals = displayData.map(d => d[dim]).filter(v => v !== null && v !== undefined);
        let ext = d3.extent(vals);
        if (ext[0] === ext[1]) ext[1] = ext[0] + 1;
        if (!isFinite(ext[0]) || !isFinite(ext[1])) ext = [0,1];
        yScales[dim] = d3.scaleLinear().domain(ext).range([svgHeight - 80, 20]).nice();
    });

    drawPlot();
    updateLegend();
}

// draw everything
function drawPlot() {
    innerG.selectAll("*").remove();
    activeBrushes.clear();

    // lines group
    const linesG = innerG.append("g").attr("class","lines");

    // draw lines
    linesG.selectAll("path.line")
        .data(displayData)
        .enter()
        .append("path")
        .attr("class","line")
        .attr("d", d => lineFor(d))
        .attr("stroke", d => colorFor(d))
        .on("mouseover", function(event,d){
            // hide all other lines
            innerG.selectAll(".line").classed("hidden-line", true);
            d3.select(this).classed("hidden-line", false).classed("highlight", true);
            showTooltip(event,d);
        })
        .on("mousemove", function(event,d){ moveTooltip(event); })
        .on("mouseout", function(){
            innerG.selectAll(".line").classed("hidden-line", false).classed("highlight", false);
            hideTooltip();
            // after mouseout, reapply current brushes/filters to shapes
            refreshVisibilityFromFilters();
        });

    // axes groups
    const axisG = innerG.selectAll(".axis")
        .data(dims)
        .enter().append("g")
        .attr("class","axis")
        .attr("transform", d => `translate(${xScale(d)},0)`);

    axisG.each(function(dim){
        d3.select(this).call(d3.axisLeft(yScales[dim]).ticks(6));
    });

    // labels
    axisG.append("text")
        .attr("y",-12)
        .attr("text-anchor","middle")
        .attr("class","axis-label")
        .text(d => d.replaceAll("_"," "));

    // brushes
    axisG.append("g")
        .attr("class","brush")
        .each(function(dim) {
            d3.select(this).call(
                d3.brushY()
                    .extent([[-20,0],[20, svgHeight - 80]])
                    .on("brush end", (event) => onBrush(event, dim))
            );
        });
}

// line path
function lineFor(d){
    return d3.line()(dims.map(k => [xScale(k), yScales[k](d[k])]));
}

// color scale & mapper
function colorFor(d){
    const colorAttr = colorSelect.value;
    if (!colorAttr || colorAttr === "none") return "#6b7280"; // neutral gray
    // categorical: Phone_Usage_Purpose
    if (colorAttr === "Phone_Usage_Purpose") {
        const cats = Array.from(new Set(displayData.map(dd => dd.Phone_Usage_Purpose))).sort();
        const ord = d3.scaleOrdinal(d3.schemeTableau10).domain(cats);
        return ord(d.Phone_Usage_Purpose);
    }
    // numeric continuous
    const vals = displayData.map(dd => +dd[colorAttr]).filter(v => !isNaN(v));
    if (vals.length === 0) return "#6b7280";
    const domain = d3.extent(vals);
    const scale = d3.scaleSequential(d3.interpolateYlOrRd).domain(domain);
    return scale(d[colorAttr]);
}

// brush handler
function onBrush(event, dim){
    const sel = event.selection;
    if (!sel) {
        activeBrushes.delete(dim);
    } else {
        const [y0,y1] = sel;
        const v0 = yScales[dim].invert(y0);
        const v1 = yScales[dim].invert(y1);
        const min = Math.min(v0,v1), max = Math.max(v0,v1);
        activeBrushes.set(dim, [min,max]);
    }
    applyBrushFiltering();
}

// apply brushes + UI filters: hide lines that do not match (display:none via class)
function applyBrushFiltering(){
    const purposeVal = purposeFilter.value;
    const ageVal = ageFilter.value;
    const addVal = addFilter.value;

    innerG.selectAll(".line").each(function(d){
        // start visible
        let visible = true;

        // UI filters (purpose)
        if (purposeVal !== "all" && (d.Phone_Usage_Purpose || "") !== purposeVal) visible = false;

        // age filter (Age not an axis but still filterable)
        if (visible && ageVal !== "all") {
            if (ageVal === "13-15") visible = visible && (d.Age >=13 && d.Age <=15);
            else if (ageVal === "16-18") visible = visible && (d.Age >=16 && d.Age <=18);
            else if (ageVal === "19+") visible = visible && (d.Age >=19);
        }

        // addiction filter
        if (visible && addVal !== "all") {
            const a = d.Addiction_Level;
            if (addVal === "1-3") visible = visible && (a >=1 && a <=3);
            else if (addVal === "4-6") visible = visible && (a >=4 && a <=6);
            else if (addVal === "7-10") visible = visible && (a >=7);
        }

        // brush filters
        if (visible && activeBrushes.size>0) {
            for (const [dim,[min,max]] of activeBrushes.entries()){
                const v = d[dim];
                if (v === null || v === undefined || v < min || v > max) { visible = false; break; }
            }
        }

        d3.select(this).classed("hidden-line", !visible);
    });
}

// called after mouseout to reapply filters state
function refreshVisibilityFromFilters(){ applyBrushFiltering(); }

// tooltip
function showTooltip(event,d){
    const html = `<strong>${d.Name || "N/A"}</strong><br/>
    Addiction: ${d.Addiction_Level ?? "n/a"}<br/>
    Daily usage: ${d.Daily_Usage_Hours ?? "n/a"} h<br/>
    Performance: ${d.Academic_Performance ?? "n/a"}`;
    tooltip.html(html).style("display","block")
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY + 12) + "px");
}
function moveTooltip(event){
    tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY + 12) + "px");
}
function hideTooltip(){ tooltip.style("display","none"); }

// UI binding
function bindUI(){
    purposeFilter.addEventListener("change", () => applyBrushFiltering());
    ageFilter.addEventListener("change", () => applyBrushFiltering());
    addFilter.addEventListener("change", () => applyBrushFiltering());

    colorSelect.addEventListener("change", () => {
        const chosen = colorSelect.value;
        // if chosen is one of dims, remove it from dims (so it disappears from axes)
        if (chosen !== "none" && ALL_DIMS.includes(chosen)) {
            dims = ALL_DIMS.filter(d => d !== chosen);
        } else {
            dims = ALL_DIMS.slice();
        }
        // recompute scales and redraw without reloading
        redrawWithNewDims();
    });

    resetBtn.addEventListener("click", () => {
        // reset filters + color
        purposeFilter.value = "all"; ageFilter.value = "all"; addFilter.value = "all";
        colorSelect.value = "none";
        initPlot();
    });
}

// redraw after dims change
function redrawWithNewDims(){
    // recompute svgWidth & xScale & yScales based on current displayData and dims
    svgWidth = Math.max(900, dims.length * axisSpacing);
    d3.select("#chart-scroll").select("svg").attr("width", svgWidth);
    xScale.domain(dims).range([0, (dims.length - 1) * axisSpacing]);

    // recompute y scales
    dims.forEach(dim => {
        const vals = displayData.map(d => d[dim]).filter(v => v !== null && v !== undefined);
        let ext = d3.extent(vals);
        if (!isFinite(ext[0]) || !isFinite(ext[1])) ext = [0,1];
        if (ext[0] === ext[1]) ext[1] = ext[0] + 1;
        yScales[dim].domain(ext).nice();
    });

    drawPlot();
    applyBrushFiltering();
    updateLegend(colorSelect.value);
}

// legend update
function updateLegend(colorAttr){
    legendDiv.html("");
    if (!colorAttr || colorAttr === "none") {
        legendDiv.append("div").text("Coloration non active.");
        return;
    }
    // categorical purpose
    if (colorAttr === "Phone_Usage_Purpose") {
        const cats = Array.from(new Set(displayData.map(d=>d.Phone_Usage_Purpose))).sort();
        const ord = d3.scaleOrdinal(d3.schemeTableau10).domain(cats);
        cats.forEach(c => {
            const item = legendDiv.append("div").attr("class","legend-item");
            item.append("div").attr("class","legend-color").style("background", ord(c));
            item.append("div").text(c);
        });
        return;
    }
    // numeric legend (min, mid, max)
    const vals = displayData.map(d => +d[colorAttr]).filter(v => !isNaN(v));
    if (vals.length === 0) { legendDiv.append("div").text("Aucune donnée pour coloration."); return; }
    const ext = d3.extent(vals);
    const scale = d3.scaleSequential(d3.interpolateYlOrRd).domain(ext);
    const container = legendDiv.append("div").style("display","flex").style("gap","12px").style("align-items","center");
    [ext[0], (ext[0]+ext[1])/2, ext[1]].forEach(v => {
        const item = container.append("div").attr("class","legend-item");
        item.append("div").attr("class","legend-color").style("background", scale(v));
        item.append("div").text(Math.round(v*100)/100);
    });
}
