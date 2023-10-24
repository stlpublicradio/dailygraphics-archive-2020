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
const { COLORS } = require("./lib/helpers");


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

  var geo_bounds = {
    'stl_city': L.latLngBounds(L.latLng(38.447763, -90.380802),L.latLng(38.869741, -90.108203)),
    'stl_metro': L.latLngBounds(L.latLng(38.0882,-91.029),L.latLng(39.2185,-89.5239)),
    'missouri': L.latLngBounds(L.latLng(35.25,-96.5),L.latLng(41.26,-88.09)),
  }
    
  var bounds = geo_bounds.stl_metro;

  var map = new L.map('map', {
    scrollWheelZoom: false,
    attribution: ''
  }).setView(bounds.getCenter(), 9).setMaxBounds(bounds);

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


  d3.json("2020-12-11-covid-nursing-homes.topojson").then(function(data) {
    
    var regions = topojson.feature(data, data.objects.collection);

    console.log(regions)
    var geojson;

    function geoJsonMarkerOptions(feature) {

      return {
      "radius": 6,
      "fillColor": feature.properties.new_cases_this_week == true ? COLORS.red : COLORS.yellow,
      "color": '#fff',
      "weight": 1,
      "opacity": 1,
      "fillOpacity": 0.7
      }
    };

    function getColor(d) {

      //example logic to get color based on number
      return d < 15 ? '#F4ECF7' :
          d < 20 ? '#D2B4DE' :
          d < 25 ? '#BB8FCE' :
          d < 30 ? '#8E44AD':
          d < 35 ? '#5B2C6F' :
          '#0f0712';
            
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
                    geojson.eachLayer( function (layer) {
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
          pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, geoJsonMarkerOptions(feature));
          },
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
        check_null = function(prop) {
          if (prop == null) {
            return 'Not reported'
          }
          else {
            return prop
          }
        } 
        
        info.update = function (props) {
				     this._div.innerHTML = '<h4>COVID-19 in nursing homes</h4>' 
          
            
					 // example ternary logic for infobox
					 +  (
             props ?
             props.name + '<br/>' + props.address + '<br/>' + props.city + '<br/><br/>Total COVID-19 cases, residents: ' + check_null(props.total_covid_cases_residents) +  '<br/>Total COVID-19 deaths, residents: ' + check_null(props.total_covid_deaths_residents) +  '<br/>Total COVID-19 cases, staff: ' + check_null(props.total_covid_cases_staff) + '<br/>Total COVID-19 deaths, staff: ' + check_null(props.total_covid_deaths_staff) 
						//  props.STATUS == 'new' ?
						//  "<strong>" + props.MUNICIPALI + '</strong> was added to the suit.'
						//  : props.STATUS == 'old' ?
						//  "<strong>" + props.MUNICIPALI + '</strong> is another municipality named in the suit.'
						//  : "<strong>" + props.MUNICIPALI + '</strong> has been dropped from the suit.'
						 : 'Hover over a facility');
				 };

				 info.addTo(map);
        
        // add legend
        
        var legend = L.control({position: 'bottomright'});

        legend.onAdd = function (map) {

          var div = L.DomUtil.create('div', 'info legend')
                    
          // Legend with strings
          div.innerHTML = '<h4>Legend</h4><i style="background:' + colors.red + '"></i> At least three new cases<br/>reported in the week ending 11/29 <br /><i style="background:' + colors.yellow + '"></i> Did not report at least three new cases<br />';
          
          // Legend with numbers
          title = ['<h4>Legend</h4>']
          // grades = [0, 15, 20, 25, 30, 35],
          // text = ['< 15%','15-19%','20-24%','25-29%','30-35%', '>35%']
          // labels = [];
          // for (var i = 0; i < grades.length; i++) {
          //     from = grades[i];
          //    to = grades[i + 1];
          //    labels.push(
          //      '<i style="background:' + getColor(grades[i] + .001) + '"></i> ' +
          //      text[i] );
          //  }
          //  div.innerHTML = title + labels.join('<br>');
          

            return div;
        };

        legend.addTo(map);
        
        })


};

//first render
render();

