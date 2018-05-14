/*
TODO
-Descriptions
  -Seminal tracks, albums per genre
  -Essential labels
-JSON Server Asynchronous
-Pre render map d3
-More genres snap, crunk, 
*/

var width = 750,
    height = 500,
    active = d3.select(null);

var projection = d3.geoAlbersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g")
    .style("stroke-width", "1.5px");

d3.queue()
    .defer(d3.json, "us.json")
    .defer(d3.csv, "locations.csv")
    .defer(d3.json, "urban-areas-groot.json")
    .defer(d3.json, "genres.json")
    .await(ready);

function ready(error, us, locations, urban, genres_json) {
  if (error) throw error;

  function clicked(d) {
    d3.select("#text").select("div").remove();

    var textArea = d3.select("#text").append("div").attr("class", "city");

    textArea.append("h1")
      .text(d.city)

    textArea.append("p")
      .text(genres_json[d.city].summary)

    var cityGenres = genres_json[d.city].genres

    for (var i = 0, len = cityGenres.length; i < len; i++) {
      console.log(cityGenres[i]);

      textArea.append("h2")
        .text(cityGenres[i].genre)

      textArea.append("p")
        .text(cityGenres[i].summary)

      textArea.append("h3")
        .text("Recommended Reading")

      textArea.selectAll(".links")
        .data(cityGenres[i].links)
        .enter().append("a")
          .attr("href", function(d) { return d.link; })
          .attr("target", "_blank")
          .text(function(d) { return d.title; })
        .append("br")
    }
  }

  // Draw US
  g.selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
      .attr("d", path)
      .attr("class", "state")
      .on("click", zoom)
      .attr("id", function(d) { return d.id});

  // Draw State Borders
  g.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "mesh")
      .attr("d", path);

    g.selectAll("path")
      .data(urban.features)
    .enter().append("path")
      .attr("d", path)
      .attr("class", "urban")

  // Add a group element for citynames
  var labelBoxes = g.selectAll(".city")
    .data(locations).enter()
    .append("g")
      .attr("id", function(d) { return d.city.replace(/\s+/g, ''); })
      .attr("transform", function(d) { return "translate(" + projection([+d.lon - 1.9, +d.lat + 0.5]) + ")"; })
      .on("click", clicked )
      .on("mouseover", function() { changeColor(this, "#f3ce58"); })
      .on("mouseout", function() { changeColor(this, "black"); });

  var labelText = labelBoxes.append("text")
    .text(function(d) { return d.city; }) 
    .attr("transform", function(d) { return "translate(5, 15)"; });

  labelText.each(function() {
    d3.select("#" + this.innerHTML.replace(/\s+/g, '')).append("rect") 
      .attr("class", "citybox")
      .attr("width", this.getBBox().width * 1.2)
      .attr("height", 20)
  });

};

function changeColor(obj, color) {
  d3.select(obj).attr("fill", color)
}

function zoom(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2;
      scale = .3 / Math.max(dx / width, dy / height),
      translate = [width / 1.5 - scale * x, height / 1.5 - scale * y];

  g.transition()
      .duration(750)
      .style("stroke-width", 1.5 / scale + "px")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  g.transition()
      .duration(750)
      .style("stroke-width", "1.5px")
      .attr("transform", "");
}
