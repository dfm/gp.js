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

  // Current version.
  george.VERSION = "0.0.1";

  // Random numbers.
  var _randNorm = null;
  george.randomNormal = function () {
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

  // Cholesky decomposition.
  george.cholesky = function (A) {
    var i, j, k, ndata = A.length, L = new Array();

    for (i = 0; i < ndata; ++i) {
      L[i] = new Array();
      for (j = 0; j <= i; ++j) {
        var s = 0.0;
        for (k = 0; k < j; ++k) {
          s += L[i][k] * L[j][k];
        }

        if (i == j) {
          L[i][i] = Math.sqrt(A[i][i] - s);
        } else {
          L[i][j] = (A[i][j] - s) / L[j][j];
        }
        console.log(s, j, L[j][j]);
      }
    }

    return L;
  };

// def cholesky(A):
//     L = [[0.0] * len(A) for _ in xrange(len(A))]
//     for i in xrange(len(A)):
//         for j in xrange(i+1):
//             s = sum(L[i][k] * L[j][k] for k in xrange(j))
//             L[i][j] = math.sqrt(A[i][i] - s) if (i == j) else \
//                       (1.0 / L[j][j] * (A[i][j] - s))
//     return L

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

    if (typeof this._alpha === "undefined" || this._alpha == null)
      this._alpha = numeric.LUsolve(this._lu, y);
    return this._alpha;
  };

  george.GaussianProcess.prototype.compute = function (x, yerr) {
    var K = this.get_kernel_matrix(x, yerr);

    // Cache the data.
    this.computed = true;
    this._x = x;
    this._yerr = yerr;
    this._alpha = null;

    // Factorize the matrix and compute the determinant.
    var tmp = this._lu = numeric.LU(K), lu = tmp.LU, p = tmp.P;
    this.lndet = 0.0;
    for (i = 0, l = lu[0].length; i < l; ++i) this.lndet += Math.log(lu[i][i]);
  };

  george.GaussianProcess.prototype.lnlike = function (y) {
    return -0.5 * (numeric.dot(this._get_alpha(y), y) + this.lndet);
  };

  george.GaussianProcess.prototype.sample = function (x) {
    var K = this.get_kernel_matrix(x, 1e-4),
        tmp = numeric.LU(K); // , lu = tmp.LU, p = tmp.P,
        // r = new Float64Array(x.length);
    console.log(george.cholesky(K));
  };

  // General kernel implementation.
  george.Kernel = function (pars, func) {
    this.npars = pars.length;
    this._pars = pars;
    this._func = func;
  };
  george.Kernel.prototype.evaluate = function (dx) {
    if (typeof dx.map !== "undefined" && dx.map != null)
      return dx.map(this.evaluate, this);
    return this._func(this._pars, dx);
  };

  // Standard kernel implementations.
  george.kernels = {
    exp_squared: function (amp, scale) {
      return new george.Kernel([amp, scale], function (p, dx) {
        var a2 = p[0] * p[0],
            s2 = p[1] * p[1];
        return a2 * Math.exp(-0.5 * dx / s2);
      });
    }
  };

}.call(this));
