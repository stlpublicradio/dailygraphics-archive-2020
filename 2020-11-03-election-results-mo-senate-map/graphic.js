var pym = require("./lib/pym");
var ANALYTICS = require("./lib/analytics");
require("./lib/webfonts");
var {
  isMobile
} = require("./lib/breakpoints");

var d3 = require("d3")

// var d3 = {
//   ...require("d3-array/dist/d3-array.min"),
//   ...require("d3-axis/dist/d3-axis.min"),
//   ...require("d3-scale/dist/d3-scale.min"),
//   ...require("d3-selection/dist/d3-selection.min"),
//   ...require("d3-fetch/dist/d3-fetch.min"),
//   ...require("d3-geo/dist/d3-geo.min"),
//   ...require("d3-color/dist/d3-color.min"),
//   ...require("d3-interpolate/dist/d3-interpolate.min"),
//   ...require("d3-zoom/dist/d3-zoom.min"),
// };

var topojson = require("topojson");
const classify = require("./lib/helpers/classify");
const {
  color, stratify
} = require("d3");
const fmtComma = require("./lib/helpers/fmtComma");

var pymChild;

var prepdata = function (data) {
  races = ['State Senate District 1','State Senate District 3','State Senate District 5','State Senate District 7','State Senate District 9','State Senate District 11','State Senate District 13','State Senate District 15','State Senate District 17','State Senate District 19','State Senate District 21','State Senate District 23','State Senate District 25','State Senate District 27','State Senate District 29','State Senate District 31','State Senate District 33']


  result = {}

  races.forEach(function (seat) {

    classified_seat = classify(seat)

    result[classified_seat] = {}

    current_race = []
    data.forEach(function (candidate) {
      candidate.pct = parseFloat(candidate.pct)
      if (classify(candidate.race) == classified_seat) {
        current_race.push(candidate)
      }
    })


    if (current_race.length == 1) {
      result[classified_seat]['winner'] = current_race[0].party
      result[classified_seat]['margin'] = 'unopposed'
      result[classified_seat]['candidates'] = [current_race[0]]
    } else {
      current_race.sort((a, b) => (a.pct < b.pct) ? 1 : -1)
      margin = current_race[0].pct - current_race[1].pct

      if (margin > 0) {
        result[classified_seat]['winner'] = current_race[0].party;
        result[classified_seat]['margin'] = current_race[0].pct - current_race[1].pct
      } else {
        result[classified_seat]['winner'] = 'None';
        result[classified_seat]['margin'] = ''
      }
      result[classified_seat]['candidates'] = []
      current_race.forEach(function (candidate) {
        result[classified_seat]['candidates'].push(candidate)
      })



    }

  });



  return result;

}

var onWindowLoaded = function () {
  var data = window.DATA;


  clean_data = prepdata(data);



  d3.json('mo_senate_map.json').then(function (map_data) {
    map = topojson.feature(map_data, map_data.objects.tl_2019_29_sldu)


    map.features.forEach(function (feature) {
      

      if (clean_data[classify(feature.properties.NAMELSAD)]) {
        feature.properties.results = clean_data[classify(feature.properties.NAMELSAD)]
      }
      else {
        feature.properties.results = {winner:'None'}
      }

      
    })

    render(map);


    window.addEventListener("resize", render(map));

    pym.then(child => {
      pymChild = child;
      child.sendHeight();
    })
  });
}



var render = function (race_results) {
  var containerElement = document.querySelector(".graphic");
  //remove fallback
  containerElement.innerHTML = "";
  var containerWidth = containerElement.offsetWidth;
  var height = containerWidth / 2;


  var container = d3.select(containerElement);


  var svg = container.append("svg");



  var infobox = container.append("div");

  infobox.append("h5")
    .attr("class", "label office")

  var table = container.append('div').attr('class','results-table')

  var table_header = table.append('div').attr('class','thead').append('div').attr('class','tr')

  table_header.append('div').attr('class','th name').attr('colspan','2').text('Candidate')

  table_header.append('div').attr('class','th percentage').text('Percent')

  table_header.append('div').attr('class','th votes').text('Votes')

table_body = table.append('div').attr('class','tbody')

footnote = table.append('div').attr('class','footnote')

footnote.append('span').attr('class','left incumbent-text').append('div').text('• — Incumbent')



  svg.attr('height', height)

  const updateInfobox = (event, d) => {
    district = d.properties.NAMELSAD
    candidates = d.properties.results.candidates

    table_body.html('')
    footnote.select('.right').remove()

    
    if (candidates) {
    infobox.select(".office").text(district)


    wrapper = table_body.selectAll('div').data(candidates).enter().append('div')
    .attr('class','row-wrapper')
    .append('div')
    .attr('class', function(d) {
      class_str = 'tr candidate ' + classify(d.party)

      if (d.winner == 'Y') {
        class_str += ' winner'
      }

      return class_str
    })

    wrapper
    .append('div')
    .attr('class','td spacer')
    .append('div')
    .attr('class', 'bar-container')
    .append('div')
    .attr('class','bar')
    .attr('style', d => 'width:' + d.pct + '%')

    wrapper.append('div')
    .attr('class','td name')
    .text(function(d) {
      if (d.inc == 'Y') {
        return d.label + ' •';
      }
      else {
        return d.label
      }
    })

    wrapper.append('div')
    .attr('class','td percentage')
    .text(d => d.pct + '%')

    wrapper.append('div')
    .attr('class','td votes')
    .text(d => fmtComma(d.votes))

    footnote.append('span').attr('class','right').text('Total votes: ' + fmtComma(candidates[0].total_votes))
  }
  else {
    infobox.select(".office").text(district + ' — no race')
  }

   

    pymChild.sendHeight()


  }






  //run your D3 functions here

  var projection = d3.geoTransverseMercator()
    .rotate([92 + 30 / 60, -35 - 50 / 60])
    .fitHeight(height, race_results);

  shift = projection.translate()

  projection.translate([shift[0] + containerWidth / 4,shift[1]])

  var path = d3.geoPath().projection(projection);


  function get_fill(d) {
    if (d.winner == 'Republican') {
      colors = ['#F8D6D4', '#d61f21']
    } else if (d.winner == 'Democratic') {
      colors = ['#D5E5F2', '#237bbd']
    } else {
      colors = ['#D7F0E2', '#15b16e']
    }

    var getColor = d3.scaleLinear().domain([0, 100])
      .range(colors);

    if (d.margin == 'unopposed') {
      margin = 100
    } else {
      margin = +d.margin;
    }

    return getColor(margin);
  }

  g = svg.append("g")

  g.selectAll("path")
    .data(race_results.features)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", function (d) {

      return get_fill(d.properties.results)
      // if (d.properties.results) {return get_fill(d.properties.results.margin)} else {return '#efefef' }
    })
    .attr("class", function (d) {

      // console.log(d)

      return classify(d.properties['NAMELSAD']) + ' ' + classify(d.properties.results.winner)

    })
    .on("mouseenter", updateInfobox)

  svg.call(d3.zoom()
    .extent([
      [0, 0],
      [containerWidth, height]
    ])
    .scaleExtent([1, 32])
    .on("zoom", zoomed));



  function zoomed({
    transform
  }) {

    g.attr("transform", transform);
  }




  if (pymChild) {
    pymChild.sendHeight();
  }
};

//first render
window.onload = onWindowLoaded;