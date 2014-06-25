//Plot various Gaussian process data products, like the kernel and the covariance matrix
//that it generates

//Enclose everything in a function for local scope
(function () {

  "use strict";

  //Plot the covariance kernel onto an svg element
  //Set up the plot space

  //Width and height of the plot
  var w = 300;
  var h = 400;
  var padding = 20; //px all sides
  var padding_axis = 40; //px in addition to the axes

  //set up scales
  var xScale = d3.scale.linear()
    .domain([0, 3])
    .range([(padding + padding_axis), w - padding])
    .nice();

  var yScale = d3.scale.linear()
    .domain([0, 3])
    .range([h - (padding + padding_axis), padding])
    .nice();

  //create axis
  var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(5);

  var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .ticks(5);

  //add the SVG to the document. Assumes there is a <div id="plot"></div>.
  //create SVG element to paint on
  var svg = d3.select("#kernel_plot")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  //Add the axes labels
  var xAxisText = svg.append("text")
    .attr("x", w/2)
    .attr("y", h - (padding/2))
    .text("r");

  var yAxisText = svg.append("text")
    .attr("x", padding/2)
    .attr("y", h/2)
    .text("k");


  //do the initial plotting

  var kernel = george.kernels.exp_squared(1.0, 1.);

  //This kernel expects an r vector
  var NPOINTS =50;
  var rr = numeric.linspace(0, 3, NPOINTS);
  var kk = [];
  for (var i = 0; i < NPOINTS; i++) {
    kk.push(kernel.evaluate(rr[i]));
  }

  var lineFunc = d3.svg.line()  //base this off the yy array, like DFM
  .x(function(d, i) {
    return xScale(rr[i]); })
  .y(function(d) { return yScale(d); })
  .interpolate("monotone");

  var lineGraph = svg.append("path")
  .attr("d", lineFunc(kk))
  .attr("stroke", "blue")
  .attr("stroke-width", 2)
  .attr("fill", "none");

  var xAxisObj = svg.append("g")
    .attr("class", "axis") //assign CSS class
    .attr("transform", "translate(0," + (h - (padding + padding_axis)) + ")" )
    .call(xAxis); //will evaluate xAxis()

  var yAxisObj = svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + (padding + padding_axis) + ",0)")
    .call(yAxis);


  //given a kernel, update the kernel plot
  var update = function(kernel){

    //these are valid for all kernels currently defined
    var amp = kernel._pars[0];
    var scale = kernel._pars[1];

    //update the scales
    xScale.domain([0, 4 * scale * scale]);

    yScale.domain([0, 1.2 * amp * amp]);

    //update rr and kk
    rr = numeric.linspace(0, 4 * scale, 50)
    kk = [];
    for (var i = 0; i < NPOINTS; i++) {
      kk.push(kernel.evaluate(rr[i]));
    }

    lineGraph.attr("d", lineFunc(kk));

    xAxisObj.call(xAxis);
    yAxisObj.call(yAxis);


  }

  window.update_kernel_plot = function(kernel) {
    //these are valid for all kernels currently defined
    var amp = kernel._pars[0];
    var scale = kernel._pars[1];

    //pass the kernel off to a function to update the plot
    update(kernel);

  }

})();

  //Instantiate a new Gaussian process using a 'squared exponential' kernel
  // var gp = new george.GaussianProcess(george.kernels.exp_squared(1.0, 1.0));

  //create a data array usingthe numeric.js library
  // var x = numeric.linspace(0, 4, 5);
  // var x = numeric.random(10);

  //use the kernel to create a covariance matrix
  // var K_matrix = gp.get_kernel_matrix(x);

  //Plot the covariance matrix onto an svg element.
  //
  //inputs:
  //  id: the div id on which to paint the graph
  //  K: the covariance matrix (2D NxN square matrix)
  //
  // inspired by grid.js https://gist.github.com/bunkat/2605010
