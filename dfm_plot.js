(function () {

  "use strict";

  var SEED = 123,
      NSAMP = 12;

  // The data.
  var x = [0.1, 0.5, 0.9, 1.25, 3.0, 5.65, 6.0, 6.1, 7.5],
      yerr = [0.1, 0.1, 0.1, 0.1, 0.1, 0.15, 0.1, 0.15, 0.1],
      x0 = numeric.linspace(0, 10, 500),
      y = x.map(function (d, i) {
        return Math.sin(d) + yerr[i] * george.random.randn();
      });

  // The GP.
  var kernel = george.kernels.exp_squared(1.0, 1.),
      gp = new george.GaussianProcess(kernel);
  gp.compute(x, yerr)

  numeric.seedrandom.seedrandom(SEED);
  var y0 = gp.sample_cond(y, x0, NSAMP);

  // Plotting.
  var w = 500, h = 300;
  var xscale = d3.scale.linear()
                 .domain([0, 8])
                 .range([0, w]),
      yscale = d3.scale.linear()
                 .domain([-2, 2])
                 .range([h, 0]);
  var svg = d3.select("#plot").append("svg")
              .attr("width", w).attr("height", h);

  var line_gen = d3.svg.line()
                   .x(function (d, i) { return xscale(x0[i]); })
                   .y(function (d) { return yscale(d); }),
      lines = svg.selectAll(".line").data(y0);
  lines.enter().append("path").attr("class", "line");
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
    kernel._pars = [
      Math.pow(10, document.getElementById("amp-slider").value),
      Math.pow(10, document.getElementById("width-slider").value)
    ];
    gp.compute(x, yerr)

    numeric.seedrandom.seedrandom(SEED);
    y0 = gp.sample_cond(y, x0, NSAMP);

    lines = svg.selectAll(".line").data(y0);
    lines.enter().append("path").attr("class", "line");
    lines.attr("d", function (d) { return line_gen(d); });
    lines.exit().remove();
  }

  d3.selectAll(".slider").on("input", update);
  d3.selectAll("#seed-button").on("click", function () {
    SEED += 1;
    numeric.seedrandom.seedrandom(SEED);
    y0 = gp.sample_cond(y, x0, NSAMP);

    lines = svg.selectAll(".line").data(y0);
    lines.enter().append("path").attr("class", "line");
    lines.transition().duration(750)
         .attr("d", function (d) { return line_gen(d); });
    lines.exit().remove();
  });

})();
