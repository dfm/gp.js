//Plot various Gaussian process data products, like the kernel and the covariance matrix
//that it generates

//Enclose everything in a function for local scope
(function () {

  "use strict";

  //Plot the covariance kernel onto an svg element
  //Set up the plot space

  //Width and height of the plot
  var w = 300;
  var h = 300;
  var padding = 30; //px

  //set up scales
  var xScale = d3.scale.linear()
    .domain([0, 3])
    .range([padding, w - padding])
    .nice();

  var yScale = d3.scale.linear()
    .domain([0, 3])
    .range([h - padding, padding])
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
  var svg = d3.select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  var get_kk = function(kernel){
    //given a george.kernels.exp_squared() etc...,
    //evalute it and plot it

    //query the parameters
    //determine the "length scale", and how many times after we should plot

  }


  var plot_values = function(){

    //use one of the kernel defined in george, exp_squared(amp, scale)
    //defines a new function, called kernel. As input, it expects a one dimensional array
    var kernel = george.kernels.exp_squared(1.0, 1.);

    //How can we use a george kernel without having to recode it?
    //This kernel expects an r vector
    var NPOINTS =50;
    var rr = numeric.linspace(0, 3, NPOINTS);
    var kk = [];
    for (var i = 0; i < NPOINTS; i++) {
      kk.push(kernel.evaluate(rr[i]));
    }

    var lineFunc = d3.svg.line()  //base this off the yy array, like DFM
    .x(function(d, i) { return xScale(rr[i]); })
    .y(function(d) { return yScale(d); })
    .interpolate("monotone");

    var lineGraph = svg.append("path")
    .attr("d", lineFunc(kk))
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("fill", "none");

    svg.append("g")
    .attr("class", "axis") //assign CSS class
    .attr("transform", "translate(0," + (h - padding) + ")" )
    .call(xAxis); //will evaluate xAxis()

    svg.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + padding + ",0)")
    .call(yAxis);
  }

  plot_values();



          //Instantiate a new Gaussian process using a 'squared exponential' kernel
  //         var gp = new george.GaussianProcess(george.kernels.exp_squared(1.0, 1.0));

          //create a data array usingthe numeric.js library
  //         var x = numeric.linspace(0, 4, 5);
  //         var x = numeric.random(10);

          //use the kernel to create a covariance matrix
  //         var K_matrix = gp.get_kernel_matrix(x);

  //         var dataset = [ 5, 10, 15, 20, 25, 10, 3 ];
  //         var dataset = numeric.linspace(0, 10, 14);


  //Plot the covariance matrix onto an svg element.
  //
  //inputs:
  //  id: the div id on which to paint the graph
  //  K: the covariance matrix (2D NxN square matrix)
  //
  // inspired by grid.js https://gist.github.com/bunkat/2605010


  function drawMatrix(id, K)
  {
      return 0;
  }


})();
