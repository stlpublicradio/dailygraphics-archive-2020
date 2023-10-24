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
  races = ['State House District 1', 'State House District 2', 'State House District 3', 'State House District 4', 'State House District 5', 'State House District 6', 'State House District 7', 'State House District 8', 'State House District 9', 'State House District 10', 'State House District 11', 'State House District 12', 'State House District 13', 'State House District 14', 'State House District 15', 'State House District 16', 'State House District 17', 'State House District 18', 'State House District 19', 'State House District 20', 'State House District 21', 'State House District 22', 'State House District 23', 'State House District 24', 'State House District 25', 'State House District 26', 'State House District 27', 'State House District 28', 'State House District 29', 'State House District 30', 'State House District 31', 'State House District 32', 'State House District 33', 'State House District 34', 'State House District 35', 'State House District 36', 'State House District 37', 'State House District 38', 'State House District 39', 'State House District 40', 'State House District 41', 'State House District 42', 'State House District 43', 'State House District 44', 'State House District 45', 'State House District 46', 'State House District 47', 'State House District 48', 'State House District 49', 'State House District 50', 'State House District 51', 'State House District 52', 'State House District 53', 'State House District 54', 'State House District 55', 'State House District 56', 'State House District 57', 'State House District 58', 'State House District 59', 'State House District 60', 'State House District 61', 'State House District 62', 'State House District 63', 'State House District 64', 'State House District 65', 'State House District 66', 'State House District 67', 'State House District 68', 'State House District 69', 'State House District 70', 'State House District 71', 'State House District 72', 'State House District 73', 'State House District 74', 'State House District 75', 'State House District 76', 'State House District 77', 'State House District 78', 'State House District 79', 'State House District 80', 'State House District 81', 'State House District 82', 'State House District 83', 'State House District 84', 'State House District 85', 'State House District 86', 'State House District 87', 'State House District 88', 'State House District 89', 'State House District 90', 'State House District 91', 'State House District 92', 'State House District 93', 'State House District 94', 'State House District 95', 'State House District 96', 'State House District 97', 'State House District 98', 'State House District 99', 'State House District 100', 'State House District 101', 'State House District 102', 'State House District 103', 'State House District 104', 'State House District 105', 'State House District 106', 'State House District 107', 'State House District 108', 'State House District 109', 'State House District 110', 'State House District 111', 'State House District 112', 'State House District 113', 'State House District 114', 'State House District 115', 'State House District 116', 'State House District 117', 'State House District 118', 'State House District 119', 'State House District 120', 'State House District 121', 'State House District 122', 'State House District 123', 'State House District 124', 'State House District 125', 'State House District 126', 'State House District 127', 'State House District 128', 'State House District 129', 'State House District 130', 'State House District 131', 'State House District 132', 'State House District 133', 'State House District 134', 'State House District 135', 'State House District 136', 'State House District 137', 'State House District 138', 'State House District 139', 'State House District 140', 'State House District 141', 'State House District 142', 'State House District 143', 'State House District 144', 'State House District 145', 'State House District 146', 'State House District 147', 'State House District 148', 'State House District 149', 'State House District 150', 'State House District 151', 'State House District 152', 'State House District 153', 'State House District 154', 'State House District 155', 'State House District 156', 'State House District 157', 'State House District 158', 'State House District 159', 'State House District 160', 'State House District 161', 'State House District 162', 'State House District 163']


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


  d3.json('mo_house_map.json').then(function (map_data) {
    map = topojson.feature(map_data, map_data.objects.tl_2019_29_sldl)

    map.features.forEach(function (feature) {
      feature.properties.results = clean_data[classify(feature.properties.NAMELSAD)]
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
    
    infobox.select(".office").text(district)

    table_body.html('')
    footnote.select('.right').remove()

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

    {/* <div class="footnote">
  <span class="left incumbent-text"><div>&bull; &ndash; Incumbent</div></span>
  <span class="right"><%= COPY.labels.stl_atty_reporting %></span>
</div> */}

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