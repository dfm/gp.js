(function () {

  // Setup etc. taken from underscore.js.

  // Establish the root object, `window` in the browser, or `exports` on the
  // server.
  var root = this;

  // Create a safe reference to the `george` object for use below.
  var george = function(obj) {
    if (obj instanceof george) return obj;
    if (!(this instanceof george)) return new george(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `george` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== "undefined") {
    if (typeof module !== "undefined" && module.exports) {
      exports = module.exports = george;
    }
    exports.george = george;
  } else {
    root.george = george;
  }

  // Constants.
  var EPS = 1e-10;

  // Current version.
  george.VERSION = "0.0.1";

  // Random numbers.
  var _randNorm = null;
  george.random = {};
  george.random.randn = function () {
    // Box-Muller transform for normally distributed random numbers.
    // http://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
    var f, u, v, s = 0.0;
    if (_randNorm !== null && typeof(_randNorm) !== "undefined") {
      var tmp = _randNorm;
      _randNorm = null;
      return tmp;
    }
    while (s === 0.0 || s >= 1.0) {
      u = 2 * numeric.seedrandom.random() - 1;
      v = 2 * numeric.seedrandom.random() - 1;
      s = u * u + v * v;
    }
    f = Math.sqrt(-2 * Math.log(s) / s);
    _randNorm = v * f;
    return u * f;
  };

  george.random._mvg_single = function (mu, L) {
    var n = mu.length, r = new Float64Array(n);
    for (i = 0; i < n; ++i) r[i] = george.random.randn();
    return numeric.add(mu, numeric.dot(L, r));
  };

  george.random.multivariate_gaussian = function (mu, cov, n) {
    var L = george.cholesky(cov);
    if (arguments.length > 2 && typeof n !== "undefined") {
      var i, samples = new Array(n);
      for (i = 0; i < n; ++i) samples[i] = george.random._mvg_single(mu, L);
      return samples;
    }
    return george.random._mvg_single(mu, L);
  };

  // Cholesky decomposition.
  george.cholesky = function (A) {
    var i, j, k, ndata = A.length, L = new Array(ndata);

    for (i = 0; i < ndata; ++i) {
      L[i] = new Float64Array(ndata);
      for (j = 0; j <= i; ++j) {
        var s = 0.0;
        for (k = 0; k < j; ++k) s += L[i][k] * L[j][k];
        if (i == j) {
          var d = A[i][i] - s;
          if (d < 0) throw "Cholesky fail";
          L[i][i] = Math.sqrt(d);
        } else L[i][j] = (A[i][j] - s) / L[j][j];
      }
    }

    return L;
  };

  // Code here.
  george.GaussianProcess = function (kernel) {
    this._kernel = kernel;
    this.computed = false;
  };

  george.GaussianProcess.prototype.get_kernel_matrix = function (x, yerr) {
    var i, j, ndata = x.length,
        zero = this._kernel.evaluate(0.0),
        K = new Array(ndata);
    for (i = 0; i < ndata; ++i)
      K[i] = new Float64Array(ndata);
    for (i = 0; i < ndata; ++i) {
      K[i][i] = zero;
      for (j = i+1; j < ndata; ++j) {
        var val = this._kernel.evaluate(x[i] - x[j]);
        K[i][j] = K[j][i] = val;
      }
    }

    if (arguments.length >= 2) {
      if (typeof yerr.length === "undefined" || yerr.length == 0)
        for (i = 0; i < ndata; ++i) K[i][i] += yerr * yerr;
      else for (i = 0; i < ndata; ++i) K[i][i] += yerr[i] * yerr[i];
    }

    return K;
  };

  george.GaussianProcess.prototype._get_alpha = function (y) {
    if (!this.computed)
      throw "You must compute the GP first";

    if (this._x.length != y.length)
      throw "Dimension mismatch";

    return numeric.LUsolve(this._lu, y);
  };

  george.GaussianProcess.prototype.compute = function (x, yerr) {
    var K = this.get_kernel_matrix(x, yerr);

    // Cache the data.
    this.computed = false;
    this._x = x;
    this._yerr = yerr;

    // Factorize the matrix and compute the determinant.
    var tmp = this._lu = numeric.LU(K), lu = tmp.LU, p = tmp.P;
    this.lndet = 0.0;
    for (i = 0, l = lu[0].length; i < l; ++i)
      this.lndet += Math.log(lu[i][i]);
    this.computed = true;
  };

  george.GaussianProcess.prototype.lnlike = function (y) {
    return -0.5 * (numeric.dot(this._get_alpha(y), y) + this.lndet);
  };

  george.GaussianProcess.prototype.sample = function (x, n) {
    var K = this.get_kernel_matrix(x, EPS),
        mu = new Float64Array(x.length);
    return george.random.multivariate_gaussian(mu, K, n);
  };

  george.GaussianProcess.prototype.predict = function (y, x, get_cov) {
    var i, j, n = this._x.length, ns = x.length, Ks = new Array(ns),
        alpha = this._get_alpha(y), mu;

    // Compute the off-diagonal covariance function.
    for (i = 0; i < ns; ++i) {
      Ks[i] = new Float64Array(n);
      for (j = 0; j < n; ++j)
        Ks[i][j] = this._kernel.evaluate(this._x[j] - x[i]);
    }

    // Compute the predictive mean.
    mu = numeric.dot(Ks, alpha);
    if (arguments.length < 3 || !get_cov) return mu;

    // Compute the predictive covariance.
    var tmp = new Array(ns), cov = this.get_kernel_matrix(x);
    for (i = 0; i < ns; ++i) tmp[i] = numeric.LUsolve(this._lu, Ks[i]);
    cov = numeric.sub(cov, numeric.dot(Ks, numeric.transpose(tmp)));

    // Add something tiny to the diagonal.
    for (i = 0; i < ns; ++i) cov[i][i] += EPS;

    return [mu, cov];
  };

  george.GaussianProcess.prototype.sample_cond = function (y, x, n) {
    var tmp = this.predict(y, x, true), mu = tmp[0], cov = tmp[1];
    return george.random.multivariate_gaussian(mu, cov, n);
  };

  // General kernel implementation.
  george.Kernel = function (pars, func) {
    this.npars = pars.length;
    this._pars = pars;
    this._func = func;
  };
  george.Kernel.prototype.evaluate = function (dx) {
    return this._func(this._pars, dx);
  };

  // Standard kernel implementations.

  george.kernels = {
    exp_squared: function (amp, scale) {
      return new george.Kernel([amp, scale], function (p, dx) { //p is array of parameters
        var a2 = p[0] * p[0],
            s2 = p[1] * p[1];
        return a2 * Math.exp(-0.5 * dx * dx / s2);
      });
    },
    matern32: function (amp, scale) {
      return new george.Kernel([amp, scale], function (p, dx) {
        var a2 = p[0] * p[0],
            s2 = p[1] * p[1],
            r = Math.sqrt(3.0 / s2) * Math.abs(dx);
        return a2 * (1.0 + r) * Math.exp(-r);
      });
    },
    matern52: function (amp, scale) {
      return new george.Kernel([amp, scale], function (p, dx) {
        var a2 = p[0] * p[0],
            s2 = p[1] * p[1],
            r = Math.sqrt(5.0 / s2) * Math.abs(dx);
        return a2 * (1.0 + r + r*r / 3.0) * Math.exp(-r);
      });
    },
    qp: function (amp, scale, period, tau) {
      return new george.Kernel([amp, scale, period, tau], function (p, dx) {
        var a2 = p[0] * p[0],
            s2 = p[1] * p[1],
            t2 = p[3] * p[3],
            r = Math.sin(Math.PI * Math.abs(dx / p[2]));
        return a2 * Math.exp(-s2 * r * r - 0.5 * dx * dx / t2);
      });
    }
  };

}.call(this));
