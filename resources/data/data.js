const fs = require("fs"),
      d3 = require("d3");

fs.readFile("./sa1s.geojson", "utf8", function(error, data) {
  if (error) throw error;
  geoData = JSON.parse(data)
    .features;

  fs.readFile("./actSa1.csv", "utf8", function(error, data) {
    if (error) throw error;
    data = d3.csvParse(data);
    cleanData = data
      .map(function(d) {
        return {
          code: d[data.columns[0]].replace(" ", ""),
          people: +d[data.columns[1]].replace(" ", "")
        }
      });

    newData = {
      type: "FeatureCollection",
      features: []
    };

    cleanData.forEach(function(d) {
      let match = geoData
        .filter(function(e) {
          return e.properties.SA1_7DIG16 == d.code;
        });
      if (match.length == 1 && d.people && match[0].properties.STE_CODE16 == "8") {
        let density = Math.round(d.people * 10 / +match[0].properties.AREASQKM16) / 10;
        if (density > 25) {
          newData.features.push({
            type: "Feature",
            geometry: match[0].geometry,
            properties: {
              density: density
            }
          });
        }
      }
    });

    colourScheme = d3.scaleSequentialLog(d3.interpolateViridis)
      .domain(newData.features.map(function(d) { return d.properties.density; }));
    height = d3.scaleLinear()
      .domain(colourScheme.domain().reverse())
      .range([0, 15000]);

    finalData = {
      type: "FeatureCollection",
      features: []
    };
    newData.features
      .forEach(function(d) {
        d.properties.fill = colourScheme(d.properties.density);
        d.properties.height = Math.round(height(d.properties.density) * 10) / 10;
        console.log(d.properties);
        finalData.features
          .push(d);
      });

    fs.writeFile("./actDensity.geojson", JSON.stringify(finalData), function(error) {
      console.log("actDensity.geojson written");
    });
  });
});
