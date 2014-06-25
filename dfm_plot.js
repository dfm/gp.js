(function () {

  "use strict";

  var STEP = 0.6,
      SEED = 123,
      NSAMP = 12;

  //List of kernel par labels
  var kernel_labels = ["a", "r", "P", "g"]

  // The GP.
  var kernel = george.kernels.exp_squared(1.0, 1.),
      gp = new george.GaussianProcess(kernel);


  function setup () {
    var i, k = document.getElementById("kernel-type").value,
        p0 = kernel._pars;
    gp._kernel = kernel = george.kernels[k]();

    d3.selectAll(".kernels").style("display", "none");
    d3.select("#"+k).style("display", "block");

    for (i = 0; i < p0.length; ++i)
      if (i < kernel.npars) kernel._pars[i] = p0[i];
    for (; i < kernel._pars.length; ++i) kernel._pars[i] = 1.0;

    // Set up the sliders.
//     var sliders = d3.select("#sliders").selectAll(".slider")
//                     .data(kernel._pars);
//     sliders.enter().append("input")
//            .attr("class", "slider")
//            .attr("type", "range")
//            .attr("min", "-1")
//            .attr("max", "1.5")
//            .attr("step", "0.001")
//            .attr("value", "0.0");
//     sliders.on("input", function (d, i) {
//       kernel._pars[i] = Math.pow(10, this.value);
//       update();
//     });
//     sliders.exit().remove();

    //Remove any previously existing slider_div 's
    d3.select("#sliders").selectAll(".slider_div").remove()

    // Set up the sliders.
    var sliders = d3.select("#sliders").selectAll(".slider")
                    .data(kernel._pars);

    var sliders_divs = sliders.enter().append("div")
       .attr("class", "slider_div")

    sliders_divs.append("span")
      .attr("class", "slider_label")
      .text(function(d, i){
        return kernel_labels[i];
      })

    sliders_divs.append("input")
        .attr("class", "slider")
        .attr("type", "range")
        .attr("min", "-1")
        .attr("max", "1.5")
        .attr("step", "0.001")
        .attr("value", "0.0");

    d3.selectAll(".slider").on("input", function (d, i) {
      kernel._pars[i] = Math.pow(10, this.value);
      update();
    });
    sliders.exit().remove();


  }
  setup();

  // The data.
  var x, y, yerr,
      x0 = numeric.linspace(0, 10, 500);

  function generate_data() {
    var i = 0, tmp = 0.0;
    x = []; yerr = [];
    while (tmp < 10.0 && i < 50) {
      tmp += STEP * Math.abs(george.random.randn());
      if (tmp < 10.0) {
        x[i] = tmp;
        yerr[i] = 0.1;
        ++i;
      }
    }

    var cov = gp.get_kernel_matrix(x, yerr);
    y = george.random.multivariate_gaussian(new Float64Array(x.length),
                                            cov);
  }
  generate_data();

  // Plot the original data.
  numeric.seedrandom.seedrandom(SEED);
  gp.compute(x, yerr);
  var y0 = gp.sample_cond(y, x0, NSAMP);

  // Plotting.
  var w = 580, h = 400;
  var xscale = d3.scale.linear()
                 .domain([0, 10])
                 .range([0, w]),
      yscale = d3.scale.linear()
                 .domain([-2.5, 2.5])
                 .range([h, 0]);
  var svg = d3.select("#plot").append("svg")
              .attr("width", w).attr("height", h);


  //y0 is a NSAMP x 500 array of lines
  //line_gen expects a single line y values, length 500 array
  //x0 is the same for every sample
  var line_gen = d3.svg.line()
                   .x(function (d, i) { return xscale(x0[i]); })
                   .y(function (d) { return yscale(d); }),
      lines = svg.selectAll(".line").data(y0);
  lines.enter().append("path").attr("class", "line");
  //for each line, dispatch the line_gen function
  lines.attr("d", function (d) { return line_gen(d); });
  lines.exit().remove();

  // Error bars.
  var points = svg.selectAll(".data").data(x);
  points.enter().append("circle").attr("class", "data");
  points.attr("cx", function (d) { return xscale(d); })
        .attr("cy", function (d, i) { return yscale(y[i]); })
        .attr("r", 4);
  points.exit().remove();

  var bars = svg.selectAll(".bar").data(x);
  bars.enter().append("line").attr("class", "bar");
  bars.attr("x1", function (d) { return xscale(d); })
      .attr("y1", function (d, i) { return yscale(y[i]-yerr[i]); })
      .attr("x2", function (d) { return xscale(d); })
      .attr("y2", function (d, i) { return yscale(y[i]+yerr[i]); })
      .attr("r", 4);
  bars.exit().remove();

  function update () {
    gp.compute(x, yerr)

    numeric.seedrandom.seedrandom(SEED);
    y0 = gp.sample_cond(y, x0, NSAMP);

    lines = svg.selectAll(".line").data(y0);
    lines.enter().append("path").attr("class", "line");
    lines.attr("d", function (d) { return line_gen(d); });
    lines.exit().remove();

    window.update_kernel_plot(kernel);
  }

  function new_seed () {
    SEED += 1;
    numeric.seedrandom.seedrandom(SEED);
    y0 = gp.sample_cond(y, x0, NSAMP);

    lines = svg.selectAll(".line").data(y0);
    lines.enter().append("path").attr("class", "line");
    lines.transition().duration(600)
         .attr("d", function (d) { return line_gen(d); });
    lines.exit().remove();
  }

  d3.selectAll("#seed-button").on("click", new_seed);
  d3.selectAll("#data-button").on("click", function () {
    generate_data();

    // Update the plot.
    points = svg.selectAll(".data").data(x);
    points.enter().append("circle").attr("class", "data");
    points.transition().duration(600)
          .attr("cx", function (d) { return xscale(d); })
          .attr("cy", function (d, i) { return yscale(y[i]); })
          .attr("r", 4);
    points.exit().remove();

    bars = svg.selectAll(".bar").data(x);
    bars.enter().append("line").attr("class", "bar");
    bars.transition().duration(600)
        .attr("x1", function (d) { return xscale(d); })
        .attr("y1", function (d, i) { return yscale(y[i]-yerr[i]); })
        .attr("x2", function (d) { return xscale(d); })
        .attr("y2", function (d, i) { return yscale(y[i]+yerr[i]); })
        .attr("r", 4);
    bars.exit().remove();

    gp.compute(x, yerr);
    new_seed();
  });

  // Change kernel types.
  d3.selectAll("#kernel-type").on("change", function () {
    setup();
    gp.compute(x, yerr);
    new_seed();
    window.update_kernel_plot(kernel);
  });

})();
