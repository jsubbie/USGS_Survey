// define query URL for EQ data for the last week 
var queryURL="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

// define query URL for tectonic plate data 

var boundaries = "https://github.com/fraxen/tectonicplates/blob/master/GeoJSON/PB2002_boundaries.json";


// reqeust data from query URL // Note: this is a boilerplate script 
d3.json(queryURL, function(data) {
  console.log(data); // track request via console 
  createFeatures(data.features); // send data response to object createFeatures
});

// markerSize function 

function markerSize(mag) {
  return mag * 5;
}

// function to return the color for each circle marker 
/// note: I looked into a few different ways to color scaling from simple to super complex,
/// although this seems like a super complicated way of (essentially) creating a color spectrum for the incidents, 
/// it includes exact values. So... if you need to do this in the future don't simply settle on > < becuase it doesn't include the 
/// entire range of values. I was genuinely hoping for something simple here, but it didn't quite work. 

function colors(mag){
  if(mag>=0 & mag<=1){
      return "#32fff4";
  }
  else if(mag>1 & mag<=2){
      return "#3168ff";
  }
  else if(mag>2 & mag<=3){
      return "#8330ff";
  }
  else if(mag>3 & mag<=4){
      return "#ff30f8";
  }
  else if(mag>4 & mag<=5){
      return "#ff9030";
  }
  else if(mag>5){
      return "#ff4b30";
  }
}

// Ok... so now we need to create a function that will run once for each feature (function loop) in the features array. 
// ...using the .bindPopup function we are going to create popups shoing the date and time of the EQ 

function createFeatures(earthquakeData) {
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: function onEachFeature(feature, layer) {
      layer.bindPopup("<h4>" + "Maginitude: " + feature.properties.mag +
        "</h4><p>" + new Date(feature.properties.time) + "</p>");
  },
  // create the GeoJSON layer containing the features array on the EQData Object, and run the onEachFeature for the data in the array 
  // L.CircleMarker, is a Leaflet feature that will let us render ... well... circular markers where the incidents occured. 
  pointToLayer: function (feature, latlng) {
    return new L.CircleMarker(latlng, {
        radius: markerSize(feature.properties.mag),
        fillColor: colors(feature.properties.mag),
        color: colors(feature.properties.mag),
        weight: 1,
        opacity: 1, 
        fillOpacity: 0.8, 
        clickable: true // makes clickable
    })
  }
});
/// create the earthquake layer with the createMap function 
  createMap(earthquakes);
};

/// define plain, sat, and street map layers using mapbox

function createMap(earthquakes) {

  var plainmap = L.tileLayer("https://api.mapbox.com/styles/v1/jmsubbie/cjfzwtqg00dnx2spozs4a96vd.html?fresh=true&title=true&access_token=pk.eyJ1Ijoiam1zdWJiaWUiLCJhIjoiY2pmenQ2bzJnMGh4dTJ3bzZmNGUxbHVsaiJ9.aWAOEsXP3I6NybftG5mZMA#12.0/48.866500/2.317600/0");

  var satellite = L.tileLayer("https://api.mapbox.com/styles/v1/jmsubbie/cjfzu3grqentw2sqpq4ub64hr.html?fresh=true&title=true&access_token=pk.eyJ1Ijoiam1zdWJiaWUiLCJhIjoiY2pmenQ2bzJnMGh4dTJ3bzZmNGUxbHVsaiJ9.aWAOEsXP3I6NybftG5mZMA#12.4/33.745751/-118.404311/0");

  var dark = L.tileLayer("https://api.mapbox.com/styles/v1/jmsubbie/cjej6ujev44yt2slcu5e0shyi.html?fresh=true&title=true&access_token=pk.eyJ1Ijoiam1zdWJiaWUiLCJhIjoiY2pmenQ2bzJnMGh4dTJ3bzZmNGUxbHVsaiJ9.aWAOEsXP3I6NybftG5mZMA#10.0/42.362400/-71.020000/0");

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Basic Map": plainmap,
    "Satellite Map": satellite,
    "Dark Map": dark,};

  // fault lines layer 
  var faultLines = new L.LayerGroup();

  // timeline Layer
  var timeLineLayer = new L.LayerGroup();

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    "Fault Lines": faultLines,
    "Time Line": timeLineLayer,
  };

  // create map and have it load basic map and earthquake layers on launch
  var myMap = L.map("map", {
    center: [0, -3.9962],
    zoom:2,
    layers: [plainmap, earthquakes, faultLines, timeLineLayer],
    maxBounds: [[90,-180], [-90, 180]]
  });

  // create layer controls // pass into baseMaps and overlayMaps // add legend to map using .addTo
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
  var legend = L.control({position: 'bottomright'});

legend.onAdd = function (myMap) {

    var div = L.DomUtil.create('div', 'info legend'),
        mag = [0,1,2,3,4,5]
        labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval 
    // boilerplate code 
    for (var i = 0; i < mag.length; i++) {
        div.innerHTML +=
            '<i style="background:' + colors(mag[i] + 1) + '"></i> ' +
            mag[i] + (mag[i + 1] ? '&ndash;' + mag[i + 1] + '<br>' : '+');
    }

    return div;
};
legend.addTo(myMap);

// read and add fault data into fault layer 
d3.json(boundaries, function(data) {
  // add geoJSON data w/ style info to fault layer 
  L.geoJson(data, {
    color: "dark orange",
    weight: 3
  })
  .addTo(faultLines);
});

d3.json(queryUrl, function(data) {
  var getInterval = function(quake) {
    // earthquake data only has a time, so we'll use that as a "start"
    // and the "end" will be that + some value based on magnitude
    // 18000000 = 30 minutes, so a quake of magnitude 5 would show on the
    // map for 150 minutes or 2.5 hours
    return {
      start: quake.properties.time,
      end:   quake.properties.time + quake.properties.mag * 1800000
    };
  };
  var timelineControl = L.timelineSliderControl({
    formatOutput: function(date) {
      return new Date(date).toString();
    }
  });
  var timeline = L.timeline(data, {
    getInterval: getInterval,
    pointToLayer: function(data, latlng){
      var hue_min = 120;
      var hue_max = 0;
      var hue = data.properties.mag / 10 * (hue_max - hue_min) + hue_min;
      return L.circleMarker(latlng, {
        radius: data.properties.mag * 3,
        color: "hsl("+hue+", 100%, 50%)",
        fillColor: "hsl("+hue+", 100%, 50%)"
      }).bindPopup('<a href="'+data.properties.url+'">click for more info</a>');
    }
  });
  timelineControl.addTo(myMap);
  timelineControl.addTimelines(timeline);
  timeline.addTo(myMap);
});
}

