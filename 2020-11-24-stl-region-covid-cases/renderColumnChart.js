var { isMobile } = require("./lib/breakpoints");
var { COLORS, makeTranslate, formatDate } = require("./lib/helpers");
const { monthDay } = require("./lib/helpers/formatDate");

var d3 = {
  ...require("d3-axis/dist/d3-axis.min"),
  ...require("d3-fetch/dist/d3-fetch.min"),
  ...require("d3-interpolate/dist/d3-interpolate.min"),
  ...require("d3-scale/dist/d3-scale.min"),
  ...require("d3-shape/dist/d3-shape.min"),
  ...require("d3-time/dist/d3-time.min"),
  ...require("d3-time-format/dist/d3-time-format.min"),
  ...require("d3-selection/dist/d3-selection.min")
};

var timeParse = d3.timeParse("%Y-%m-%d");
var timeFormat = d3.timeFormat("%-m/%-d");
var fmtComma = s => s.toLocaleString().replace(/\.0+$/, "");

// Render a column chart.
module.exports = function(config) {

  // Setup chart container
  var { labelColumn, valueColumn } = config;

  config.data = config.data.slice(-180,-1)

  console.log(config.data)

  var aspectWidth = isMobile.matches ? 4 : 16;
  var aspectHeight = isMobile.matches ? 3 : 9;
  var valueGap = 6;

  var margins = {
    top: 5,
    right: 5,
    bottom: 25,
    left: 35
  };

  var ticksY = 4;
  var roundTicksFactor = 50;

  // Calculate actual chart dimensions
  var chartWidth = config.width - margins.left - margins.right;
  var chartHeight =
    Math.ceil((config.width * aspectHeight) / aspectWidth) -
    margins.top -
    margins.bottom;

  // Clear existing graphic (for redraw)
  var containerElement = d3.select(config.container);
  containerElement.html("");

  // Create the root SVG element.
  var chartWrapper = containerElement
    .append("div")
    .attr("class", "graphic-wrapper");

  var chartElement = chartWrapper
    .append("svg")
    .attr("width", chartWidth + margins.left + margins.right)
    .attr("height", chartHeight + margins.top + margins.bottom)
    .append("g")
    .attr("transform", `translate(${margins.left},${margins.top})`);

  // Create D3 scale objects.
  // var xScale = d3
  //   .scaleBand()
  //   .range([0, chartWidth])
  //   .round(true)
  //   .padding(0.1)
  //   .domain(config.data.map(d => d[labelColumn]));



  var xScale = d3.scaleTime()
  .domain([timeParse(config.data.slice(0)[0].date),timeParse(config.data.slice(-1)[0].date)])
  .range([0,chartWidth])


  var xBand = d3.scaleBand()
  .domain(config.data.map(d => d.date))
  .range([0,chartWidth])
  .padding(.2)

  var floors = config.data.map(
    d => Math.floor(d[valueColumn] / roundTicksFactor) * roundTicksFactor
  );

  var min = Math.min(...floors);

  if (min > 0) {
    min = 0;
  }

  var ceilings = config.data.map(
    d => Math.ceil(d[valueColumn] / roundTicksFactor) * roundTicksFactor
  );

  var max = Math.max(...ceilings);

  var yScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([chartHeight, 0]);

  // Create D3 axes.
  var xAxis = d3
    .axisBottom()
    .scale(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(function(d, i) {
      
      return monthDay(d);
    });

  var yAxis = d3
    .axisLeft()
    .scale(yScale)
    .ticks(ticksY)
    .tickFormat(d => fmtComma(d));

  // Render axes to chart.
  chartElement
    .append("g")
    .attr("class", "x axis")
    .attr("transform", makeTranslate(0, chartHeight))
    .call(xAxis);

  chartElement
    .append("g")
    .attr("class", "y axis")
    .call(yAxis);

  // Render grid to chart.

  chartElement
    .append("g")
    .attr("class", "y grid")
    .call(
      yAxis
        .tickSize(-chartWidth, 0)
        .tickFormat("")
    );

  // Render bars to chart.
  chartElement
    .append("g")
    .attr("class", "bars")
    .selectAll("rect")
    .data(config.data)
    .enter()
    .append("rect")
    .attr("x", d => xScale(timeParse(d[labelColumn])))
    .attr("y", d => (d[valueColumn] < 0 ? yScale(0) : yScale(d[valueColumn])))
    .attr("width", xBand.bandwidth())
    .attr("height", d =>
      d[valueColumn] < 0
        ? yScale(d[valueColumn]) - yScale(0)
        : yScale(0) - yScale(d[valueColumn])
    )
    .attr("class", function(d) {
      return "bar bar-" + d[labelColumn];
    });

  // Render 0 value line.
  if (min < 0) {
    chartElement
      .append("line")
      .attr("class", "zero-line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0));
  }

var line = d3.line()
.x(d => xScale(timeParse(d[labelColumn])))
.y(d => yScale(d["new_cases_7_day_avg"]))

chartElement
    .append("g")
    .attr("class", "lines")
    .selectAll("path")
    .data([config.data])
    .enter()
    .append("path")
    .attr("class", "avg-line")
    .attr("stroke", COLORS.blue)
    .attr("fill","none")
    .attr("d", d => line(d));

  // Render bar values.
  // chartElement
  //   .append("g")
  //   .attr("class", "value")
  //   .selectAll("text")
  //   .data(config.data)
  //   .enter()
  //   .append("text")
  //   .text(d => d[valueColumn].toFixed(0))
  //   .attr("x", d => xScale(timeParse(d[labelColumn])) - xBand.bandwidth()/2)
  //   .attr("y", d => yScale(d[valueColumn]))
  //   .attr("dy", function(d) {
  //     var textHeight = this.getBBox().height;
  //     var $this = d3.select(this);
  //     var barHeight = 0;

  //     if (d[valueColumn] < 0) {
  //       barHeight = yScale(d[valueColumn]) - yScale(0);

  //       if (textHeight + valueGap * 2 < barHeight) {
  //         $this.classed("in", true);
  //         return -(textHeight - valueGap / 2);
  //       } else {
  //         $this.classed("out", true);
  //         return textHeight + valueGap;
  //       }
  //     } else {
  //       barHeight = yScale(0) - yScale(d[valueColumn]);

  //       if (textHeight + valueGap * 2 < barHeight) {
  //         $this.classed("in", true);
  //         return textHeight + valueGap;
  //       } else {
  //         $this.classed("out", true);
  //         return -(textHeight - valueGap / 2);
  //       }
  //     }
  //   })
  //   .attr("text-anchor", "middle");

  };
