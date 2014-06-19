# GP.js

Gaussian processes *in the browser*

`gp.js` contains the meat
`plot.js` contains the seasoning (visualization)

## Quickstart for JS API

How to instantiate a GP, covariance kernel, and evaluate a covariance matrix.

  //Instantiate a new Gaussian process using a 'squared exponential' kernel
  gp = new george.GaussianProcess(george.kernels.exp_squared(1.0, 1.0))

  //create a data array usingthe numeric.js library
  x = numeric.linspace(-5, 5, 50)

  //use the kernel to create a covariance matrix
  var K_matrix = gp.get_kernel_matrix(x)

