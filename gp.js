(function () {

  "use strict";

  var kernel = window.Kernel = function (params) {
    this.params = params;
  };

  kernel.prototype.compute = function (x1, x2) {
    var d = x1 - x2,
        pars = this.params;
    return pars[0]*pars[0]*Math.exp(-0.5*d*d/pars[1]/pars[1]);
  }

  var gp = window.GaussianProcess = function (kernel) {
    this.kernel = kernel;
  };

  gp.prototype.compute = function (x, yerr) {
    var this_ = this, K = x.map(function (x1) {
      return x.map(function (x2) {
        return this_.kernel.compute(x1, x2);
      });
    });
    for (var i = 0, l = x.length; i < l; ++i) K[i][i] += yerr[i]*yerr[i];
    this._x = x;
    this._lu = numeric.LU(K);
  };

  gp.prototype.predict = function (y, x) {
    var i, j, l, this_ = this,
        alpha = numeric.LUsolve(this._lu, y),
        Kxs = this._x.map(function (x1) {
      return x.map(function (x2) {
        return this_.kernel.compute(x1, x2);
      });
    }),
        cov = x.map(function (x1) {
      return x.map(function (x2) {
        return this_.kernel.compute(x1, x2);
      });
    }),
        KxsT = numeric.transpose(Kxs),
        Kr = KxsT.map(function (k) {
      return numeric.LUsolve(this_._lu, k);
    });

    Kr = numeric.dot(Kr, Kxs);
    cov = numeric.add(cov, Kr);

    return [numeric.dot(KxsT, alpha), cov];
  };

})();
