var pym = require("./lib/pym");
// var ANALYTICS = require("./lib/analytics");
require("./lib/webfonts");
var {
  isMobile
} = require("./lib/breakpoints");

var d3 = {
  ...require("d3-selection/dist/d3-selection.min"),
  ...require("d3-fetch/dist/d3-fetch.min")
};

var topojson = require("topojson");

var L = require("leaflet");

var pymChild = null;

pym.then(function (child) {
  pymChild = child;
  child.sendHeight();

  // window.addEventListener("resize", render);
});

var render = function () {


  var containerElement = document.querySelector(".graphic");
  //remove fallback
  containerElement.innerHTML = "";
  var containerWidth = containerElement.offsetWidth;

  var container = d3.select(containerElement);

  container.attr("id", "map");

  var colors = {
    'brown': '#6b6256',
    'tan': '#a5a585',
    'ltgreen': '#70a99a',
    'green': '#449970',
    'dkgreen': '#31716e',
    'ltblue': '#55b7d9',
    'blue': '#358fb3',
    'dkblue': '#006c8e',
    'yellow': '#f1bb4f',
    'orange': '#f6883e',
    'tangerine': '#e8604d',
    'red': '#cc203b',
    'pink': '#c72068',
    'maroon': '#8c1b52',
    'purple': '#571751'
  };

  var map_styles = {
    'dark': 'stlpr/ckbco8znk10cn1jlz0d8kpr7n',
    'light': 'stlpr/ckbcob9ja0p2q1it4nwvvx9zs',
    'satellite': 'stlpr/ckbcolxk2040t1jmlxiwd503j'
  }





  var bounds = L.latLngBounds(L.latLng(36.0, -95.77), L.latLng(42.63, -85.21));

  var map = new L.map('map', {
    scrollWheelZoom: false,
    attribution: ''
  }).setView(bounds.getCenter(), 6).setMaxBounds(bounds);

  var tiles = L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
      attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
      tileSize: 512,
      maxZoom: 18,
      zoomOffset: -1,
      id: map_styles.light,
      accessToken: "pk.eyJ1Ijoic3RscHIiLCJhIjoicHNFVGhjUSJ9.WZtzslO6NLYL8Is7S-fdxg",
    }
  ).addTo(map);

  var svg = d3.select(map.getPanes().overlayPane).append("svg"),
    g = svg.append("g").attr("class", "leaflet-zoom-hide");


  d3.json("early_vote.topojson").then(function (data) {
    var regions = topojson.feature(data, data.objects.early_vote);
    var geojson;

    function getColor(d) {

      if (typeof(d) == 'string') {
      pct = +d.replace('%', '')
      }
      else {
        pct = null
      }

      console.log(pct)

      //example logic to get color based on number
      return pct > 60 ? '#0f0712' :
        pct > 50 ? '#5B2C6F' :
        pct > 40 ? '#8E44AD' :
        pct > 30 ? '#BB8FCE' :
        pct > 20 ? '#D2B4DE' :
        pct > 0 ? '#F4ECF7' :
        '#000';

    }

    function style(feature) {
      return {
        // update property
        fillColor: getColor(feature.properties.pct),
        weight: 1,
        opacity: 1,
        color: '#fff',
        fillOpacity: 0.7
      };
    }

    //set up highlighting function

    function highlightFeature(e) {
      var layer = e.target;

      layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
      });

      info.update(layer.feature.properties);

      if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
      }
    }

    function resetHighlight(e) {
      geojson.resetStyle(e.target);
      info.update();
    }

    function clickHighlight(e) {
      geojson.eachLayer(function (layer) {
        geojson.resetStyle(layer);
      });
      highlightFeature(e)
    }

    function onEachFeature(feature, layer) {
      layer.on({
         mouseover: highlightFeature,
         mouseout: resetHighlight,
         click: clickHighlight
      });
    }

    geojson = L.geoJson(regions, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);

    // add infobox

    var info = L.control();

    info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
      this.update();
      return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
      this._div.innerHTML = '<h4>2020 Early voting<br/>(as a percentage of total vote)</h4>'

        // 					 // example ternary logic for infobox
        +
        (
          props ?
          props.NAMELSAD + ' voters cast ' + props.pct + ' of votes early in 2020.'
 :
          'Hover over a place');
    };

    info.addTo(map);

    // add legend

    var legend = L.control({
      position: 'bottomright'
    });

    legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend')

      // Legend with strings
      // div.innerHTML = '<i style="background:' + colors.red + '"></i> Added to the suit<br /><i style="background:' + colors.maroon + '"></i> Also named in the suit<br /><i style="background:' + colors.green + '"></i> Dropped from the suit<br />';

      // Legend with numbers
      title = ['<h4>Percentage of 2020 votes<br/>that were cast early</h4>']
      grades = ['1%','21%','31%','41%','51%','61%'],
        text = ['< 20%', '20-30%', '30-40%', '40-50%', '50-60%', '>60%']
      labels = [];
      for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];
        labels.push(
          '<i style="background:' + getColor(grades[i]) + '"></i> ' +
          text[i]);
      }
      div.innerHTML = title + labels.join('<br>');


      return div;
    };

    legend.addTo(map);

  })


};

//first render
render();