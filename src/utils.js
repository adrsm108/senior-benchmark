/*
 * utils.js
 *
 * Some general helper functions, mostly functional programming constructs that js doesn't have standard versions of.
 * Feel free to add!
 *
 * */

//------------ PRIVATE FUNCTIONS  ------------//

// import * as d3 from 'd3';
// import {sum as d3Sum, mean as d3Mean} from 'd3';
import * as d3 from 'd3';

export const identity = (x) => x;

//------------ EXPORTED FUNCTIONS  ------------//

/**
 * Returns `f` if it is a function, or the identity function otherwise.
 * @param f
 * @returns {function}
 */
export function orIdentity(f) {
  return typeof f === 'function' ? f : identity;
}

/**
 * Returns the functional composition of its arguments.
 *
 * `comp(f, g, h)` is equivalent to `(x) => f(g(h(x)))`
 *
 * @param {function} fns
 * @returns {function}
 */
export function comp(...fns) {
  return fns.reduceRight((g, f) => (...x) => f(g(...x)));
}

/**
 * Returns the functional right-composition of its arguments.
 *
 * `rightComp(f, g, h)` is equivalent to `(x) => h(g(f(x)))`.
 * @param {function} fns
 * @returns {function}
 */
export function rightComp(...fns) {
  return fns.reduce((g, f) => (...x) => f(g(...x)));
}

/**
 * Returns the first element of `a`.
 * @param {*[]} arr
 * @returns {*}
 */
export function first(arr) {
  return arr[0];
}

/**
 * Returns the second element of `a`.
 * @param {*[]} arr
 * @returns {*}
 */
export function second(arr) {
  return arr[1];
}

/**
 * Returns the last element of `a`.
 * @param {*[]} arr
 * @returns {*}
 */
export function last(arr) {
  return arr[arr.length - 1];
}

/**
 * Returns copy of `a` without the first element.
 * @param {*[]} arr
 * @returns {*[]}
 */
export function rest(arr) {
  return arr.slice(1);
}

/**
 * Returns copy of `a` without the last element.
 * @param {*[]} arr
 * @returns {*[]}
 */
export const most = (arr) => arr.slice(0, -1);

/**
 * Returns `!x`
 * @param {*} x
 * @returns {boolean}
 */
export const not = (x) => !x;

/**
 * Function that behaves like the || operator, returning its first truthy argument, or its last argument if none are truthy.
 * @param {...*} args
 * @returns {*}
 */
export const or = (...args) => args.find(identity) || last(args);

/**
 * Returns a function that returns its first truthy argument, or <tt>def</tt> if none exists.
 * @param {*} def
 * @returns {function(...*): *}
 */
export const orDefault = (def) => (...args) => or(...args, def);

/**
 * Function that behaves like the && operator, returning its first falsy argument, or its last argument if none are falsy.
 * @param {...*} args
 * @returns {*}
 */
export const and = (...args) => args.find(not) && last(args);

/**
 * Returns a function that returns its first falsy argument, or <tt>def</tt> if none exists.
 * @param {*} def
 * @returns {function(...*): *}
 */
export const andDefault = (def) => (...args) => and(...args, def);

/**
 * Returns the function that extracts the item at key <tt>k</tt> from its argument.
 * If `k` is a negative numerical index, `part(k)` returns a function that extracts the item at the `k`th from last index.
 * @param {string|number} k The string or index to be used as a key.
 * @returns {function}
 */
export function part(k) {
  return k < 0 ? (a) => a[a.length + k] : (a) => a[k];
}

export const times = (c) => (x) => x * c;
export const plus = (c) => (x) => x + c;

/** Returns space-separated string concatenation of truthy arguments.

 Useful for conditionally assigning classes;
 `classConcat(cond1 && class1, cond2 && class2, ...)`
 returns the string of classes whose associated conditions are true.
 * @param {*} classes
 * @return string
 */
export function classConcat(...classes) {
  return classes.reduce(
    (classList, item) => (item ? classList + ' ' + item : classList),
    ''
  );
}

/* Group items in a collection using a function.
groupBy(coll, f) returns a new Map
{ x1 => [ e in coll such that f(e) === x1 ],
  x2 => [ e in coll such that f(e) === x2 ], ... }
*/
export function groupBy(coll, f) {
  const map = new Map();
  for (const el of coll) {
    const key = f(el);
    if (map.has(key)) {
      map.get(key).push(el);
    } else {
      map.set(key, [el]);
    }
  }
  return map;
}

/* Count the number of items in a collection.
tally(coll) returns a new Map associating distinct elements of coll with the # of times they appear.
tally(coll, f) returns a new Map
{ x1 => (# of e in coll such that f(e) === x1),
  x2 => (# of e in coll such that f(e) === x2), ... }
* */
export function tally(coll, f = identity) {
  const map = new Map();
  for (const el of coll) {
    const key = f(el);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

/**
 * n dimensional euclidean distance.
 * @param {number[]} p0
 * @param {number[]} p1
 * @returns {number}
 */
export function dist(p0, p1) {
  if (p0.length !== p1.length) {
    throw new TypeError(`Arguments ${p0} and ${p1} have unequal dimension.`);
  }
  return Math.hypot(...p0.map((pi, i) => pi - p1[i]));
}

/**
 * Euclidean distance optimized for R2.
 * @param {number[]} p0
 * @param {number[]} p1
 * @returns {number}
 */

export function dist2d(p0, p1) {
  return Math.hypot(p0[0] - p1[0], p0[1] - p1[1]);
}

/**
 * Returns the millisecond duration <tt>ms</tt> as a timestring in the format <tt>DDd hh:mm:ss:lll</tt>.
 *
 * The optional argument minSegs can be used to change the minimum number of segments in the output.
 * By default, the result consists of two segments (seconds and milliseconds), with minutes, hours, and days
 * hidden unless their values are nonzero.
 *
 * In general, enough segments are included to fully describe the given duration.
 * Setting the optional argument overflow to false will prevent the inclusion of additional segments, ensuring
 * the result has exactly minSegs segments (taken from right to left).
 *
 * @param {number} ms - Number of milliseconds.
 * @param {number} [minSegs=2] - Minimum number of sections in returned string.
 * @param {boolean} [overflow=true] - Whether to add additional sections as needed.
 * @returns {string} - A string in <tt>...dd:hh:mm:ss:lll</tt> format.
 *
 * @example
 * formatMilliseconds(1234) // '01.234'
 * formatMilliseconds(-123456) // '-02:03.456'
 * formatMilliseconds(123) // '00.123'
 * formatMilliseconds(123, 1) // '123'
 * formatMilliseconds(123, 3) // '00:00.123'
 * formatMilliseconds(0.125, 0) // ''
 * formatMilliseconds(0.125, 1) // '000'
 * formatMilliseconds(123456, 2) // '02:03.456'
 * formatMilliseconds(123456, 2, false) // '03.456'
 * formatMilliseconds(123456, 4, false) // '00:02:03.456'
 */
export function formatMilliseconds(ms, minSegs = 2, overflow = true) {
  const mods = [1000, 60, 60, 24]; // modulus for ms, sec, min, hr
  const seps = ['', '.', ':', ':']; // separator characters
  const digits = (n) =>
    // returns # of decimal digits in integer part of n, or 0 if the integer part of n is 0.
    (n = Math.trunc(n)) && comp(Math.floor, Math.log10, Math.abs)(n) + 1;

  const [t, str] = mods.reduce(
    ([t, str], m, i) => [
      Math.floor(t / m),
      ((overflow && (t = Math.floor(t % m))) || minSegs > i
        ? t.toString().padStart(digits(m - 1), '0') + seps[i]
        : '') + str,
    ],
    [Math.abs((ms = Math.round(ms))), '']
  );

  return (
    (ms < 0 ? '-' : '') + (t || minSegs >= 5 ? t.toFixed() + 'd ' : '') + str
  );
}

// Returns execution time for f(...args) along with its result
export function timing(f, ...args) {
  const t0 = performance.now();
  const res = f(...args);
  const t1 = performance.now();

  return {time: t1 - t0, result: res};
}

// Runs f(...args) n times, returning execution time statistics and last evaluation result.
export function repeatedTiming(n, f, ...args) {
  n = Math.floor(n);
  if (n < 1) throw new TypeError('Number of trials should be greater than 1.');
  if (n === 1) return timing(f, ...args);
  const times = [];
  let t0, t1, result;
  let i = n;
  while (i--) {
    t0 = performance.now();
    result = f(...args);
    t1 = performance.now();
    times.push(t1 - t0);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / n;
  return {
    avgTime,
    trials: n,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    stdDev: Math.sqrt(
      times.reduce((s, t) => s + (t - avgTime) ** 2, 0) / (n - 1)
    ),
    result,
  };
}

/**
 * Returns the result of mapping f over a range of integers.
 * @param {number} n -- a number
 * @param {function(number)} f -- a function
 * @returns {*[]} [f(0), f(1), ..., f(floor(n-1))] if n >= 1 <br/>
 * [f(0), f(-1), ..., f(ceil(n+1))] if n <= -1 <br/>
 * [] if -1 < n < 1
 */
export function mapLength(n, f) {
  return Array.from(
    {length: Math.abs(n)},
    n >= 0 ? (_, i) => f(i) : (_, i) => f(-i)
  );
}

/* Gets the specified properties of an object as an array, with optional transformation.
 takeValues(obj, [k1, k2, ...]) ~~> [ obj[k1], obj[k2], ... ]
 takeValues(obj, [k1, k2, ...], f) ~~> [ f(obj[k1], k1), f(obj[k2], k2), ... ]
*/
export function takeValues(obj, keys, f = identity) {
  return keys.map((k) => f(obj[k], k));
}

export function total(array) {
  return array.length ? array.reduce((s, x) => s + x, 0) : Number.NaN;
}

export function mean(array) {
  return array.length ? total(array) / array.length : Number.NaN;
}

export function clamp(n, nMin, nMax) {
  if (nMin > nMax) {
    throw new RangeError(`[${nMin}, ${nMax}] is not a valid interval.`);
  }
  return Math.min(Math.max(n, nMin), nMax);
}

export function chop(n, epsilon = Number.EPSILON) {
  return Math.abs(n) < epsilon ? 0 : n;
}

// Mathematical modulo operation. Sign of result is determined by second argument: mod(x, n) is in [0, n) for n > 0, or
// (n, 0] for n < 0. mod(x, 0) returns NaN for all x.
function mod(x, n) {
  const m = x % n;
  return m + (m && x * n < 0 ? n : 0); // add n when m is not 0 and x and n have different signs
}

// modChop(x, n, ε) ~~> 0 if mod(x, n) ∈ [0, ε] ∪ [n − ε, n),
//                      mod(x, n) otherwise.
function modChop(x, n, epsilon = Number.EPSILON) {
  const m = mod(x, n);
  return Math.abs(m) <= epsilon || Math.abs(m - n) <= epsilon ? 0 : m;
}

// Attempts to determine the number of fixed digits of decimal precision returned by performance.now();
// This may be a nonpositive or even negative integer, depending on the coarseness of the timer.
function getPrecision(x, maxPrec = 2) {
  if (maxPrec < 0) throw new RangeError('maxPrec must be nonnegative.');
  if (x === 0) return Number.NaN;

  const eps = 10 ** -maxPrec; // precision threshold
  x = Math.abs(x); // ensure x is positive
  // we want the greatest integer k such that x ≡ 0 (mod 10^k) Clearly k is bounded above by log10(x).
  // Furthermore, if x has a nonzero fractional part, then k <= log10(x mod 1).
  let k = Math.round(Math.log10(modChop(x, 1, eps) || x));
  while (modChop(x, 10 ** k, eps) && -maxPrec <= k) {
    k--;
  }

  return -k || 0;
}

// Attempts to measure the resolution of performance.now() in milliseconds.
// Returns an object with keys {resolution, precision}.
function getTimerInfo(minPrec = 0, maxPrec = 2) {
  let res = Number.POSITIVE_INFINITY;
  for (
    let i = 0, m = 0, n = 0;
    i < 3 && (i + 1) * (n - m) < 1000; // repeat 3 times or until total computation time risks exceeding 1000ms.
    i++, res = Math.min(n - m, res)
  ) {
    m = performance.now();
    while (m === (n = performance.now())) {} // wait for performance.now() to change value
  }

  return {
    resolution: res,
    precision: clamp(getPrecision(res, maxPrec), minPrec, maxPrec),
  };
}

//
/**
 * console.log the first argument before returning it.
 * @param {*} val -- value to be logged
 * @param {...*} prefix -- values to pass to console.log before val
 * @returns {*} val
 */
export function echo(val, ...prefix) {
  console.log(...prefix, val);
  return val;
}

// bisection method for finding y coordinate on a path at a particular x
// Given:
//    path: DOM node for an svg path element tracing a parametric path
//      p(t) = { x: x(t), y: y(t) }, 0 <= t <= path.totalLength(), where x(t) is monotonic,
//    mx: a real number
// Returns: the point p(t*) = { x: x(t*), y: y(t*) }, where t* is the integer minimizing |x(t*) - mx|.
/* TODO: You could probably implement Newton's method if you could figure out how d3 generates
    its control points for the spline. That might be cool. */
export function getPointOnPathFromX(path, mx) {
  const p = (t) => path.getPointAtLength(t);
  let t, pt;
  let a = 0,
    b = path.getTotalLength();
  if (p(b).x - p(a).x < 0) [a, b] = [b, a]; // ensure x(a) <= x(b)
  while (true) {
    t = Math.floor((a + b) / 2); // t is an integer
    pt = p(t);

    if ((a === t || b === t) && pt.x !== mx) /* close enough! */ break;
    else if (pt.x > mx) b = t;
    else if (pt.x < mx) a = t;
    else break; //position found
  }

  return pt;
}

/**
 * Shuffles the array `arr` in place, using the
 * [Fisher-Yates algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle).
 * Returns the shuffled array.
 *
 * @param {*[]} arr
 * @returns {*[]}
 */
export function shuffleInPlace(arr) {
  let j = arr.length;
  let i;
  while (j--) {
    i = Math.floor(Math.random() * (j + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Kernel density estimation using binned frequency data.
 * @param {number[]} data
 * @param {'uniform'|'triangular'|'quadratic'|'gaussian'|'cosine'|'sigmoid'|function(number):number} kernel
 * @param {number} bandwidth
 * @param {boolean} [normalize]
 * @returns {number[]}
 */
export function binnedKDE(data, kernel, bandwidth, normalize = true) {
  let K;
  K =
    typeof kernel === 'function'
      ? kernel
      : kernel === 'uniform'
      ? (x) => (Math.abs(x) <= 1 ? 0.5 : 0)
      : kernel === 'triangular'
      ? (x) => ((x = Math.abs(x)) <= 1 ? 1 - x : 0)
      : kernel === 'gaussian'
      ? (x) => Math.exp(-0.5 * x ** 2) / Math.sqrt(2 * Math.PI)
      : kernel === 'cosine'
      ? (x) =>
          Math.abs(x) <= 1 ? 0.25 * Math.PI * Math.cos(0.5 * Math.PI * x) : 0
      : kernel === 'sigmoid'
      ? (x) => 1 / (Math.PI * Math.cosh(x))
      : (x) => (Math.abs(x) <= 1 ? 0.75 * (1 - x ** 2) : 0); // Default quadratic
  if (normalize) {
    const kde = mapLength(data.length, (i) =>
      d3.mean(data, (freq, j) => freq * K((i - j) / bandwidth))
    );
    return kde.map(times(1 / d3.sum(kde)));
  } else {
    mapLength(
      data.length,
      (i) =>
        d3.mean(data, (freq, j) => freq * K((i - j) / bandwidth)) / bandwidth
    );
  }
}

/**
 * Attempts to find a random point [x, y] such that
 * 1. 0 <= x < maxX, and 0 <= y < maxY
 * 2. The euclidean distance between [x,y] and `point` is at least `minD`.
 *
 * This is not a sophisticated algorithm.
 * We randomly generate a point satisfying criterion 1, then check whether it also satisfies criterion 2.
 * If it does, this point is returned; otherwise, the process repeats.
 * After 25 failed attempts, a warning is issued to the console, and the last randomly selected point is returned.
 *
 * @param {number} maxX
 * @param {number} maxY
 * @param {number[]} point
 * @param {number} minD
 * @returns {number[]}
 */
export function getRandomPointAtDistanceFrom(maxX, maxY, point, minD) {
  if (!point) return [maxX * Math.random(), maxY * Math.random()];
  let attempts = 25;
  let p;
  while (
    attempts &&
    dist2d((p = [maxX * Math.random(), maxY * Math.random()]), point) < minD
  ) {
    attempts--;
  }
  if (!attempts) {
    console.warn(
      `Failed to find point in region bounded by [0,0], [${maxX}, ${maxY}] with distance ${minD} from [${point}].`
    );
  }
  return p;
}

/**
 * Attempts to format a number or string representation of a number as an (english) ordinal.
 * i.e. `toOrdinal(21)` should produce `"21st"`.
 * @param {number|string} n
 * @returns {string}
 */
export function toOrdinal(n) {
  n = n.toString();
  return `${n}${
    /^(\d*[02-9])?1$/.test(n) // matches number string ending in 1 but not 11.
      ? 'st'
      : /^(\d*[02-9])?2$/.test(n) // matches number string ending in 2 but not 12.
      ? 'nd'
      : /^(\d*[02-9])?3$/.test(n) // matches number string ending in 3 but not 13.
      ? 'rd'
      : 'th'
  }`;
}

function vecCheck(v1, v2) {
  if (v1.length === v2.length) return true;
  throw new TypeError(
    `Arguments ${JSON.stringify(v1)} and ${JSON.stringify(
      v2
    )} are not of equal length.`
  );
}
export const vecPlus = (v1, v2) => vecCheck(v1, v2) && v1.map((vi, i) => vi + v2[i]);
export const vecMinus = (v1, v2) => vecCheck(v1, v2) && v1.map((vi, i) => vi - v2[i]);
export const vecScale = (v, a) => v.map((vi) => a * vi);
export const vecLength = v => Math.hypot(...v);
export const vecDot = (v1, v2) => vecCheck(v1, v2) && v1.reduce((s, vi, i) => s + vi * v2[i], 0);

export {mod, modChop, getTimerInfo, getPrecision};
