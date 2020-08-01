/*
 * utils.js
 *
 * Some general helper functions, mostly functional programming constructs that js doesn't have standard versions of.
 * Feel free to add!
 *
 * */

//------------ PRIVATE FUNCTIONS  ------------//

// Identity function (nice version so webstorm doesn't complain about arity)
function identity(x, ..._) {
  return x;
}

//------------ EXPORTED FUNCTIONS  ------------//

/* Returns space-separated string concatenation of truthy arguments.

Useful for conditionally assigning classes.
classConcat(cond1 && class1, cond2 && class2, ...) ~~> string of classes whose associated conditions are true.
*/
export function classConcat(...classes) {
  return classes.reduce((classList, item) => (item ? `${classList} ${item}` : classList), '');
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

// 2D Euclidean distance
export function dist2d([x0, y0], [x1, y1]) {
  return Math.sqrt((x0 - x1) ** 2 + (y0 - y1) ** 2);
}

/*
Returns a string representation of the given number of milliseconds in hh:mm:ss:fff format.
Second argument can be used to specify the minimum number of segments in the result. With the default value (2),
hours and minutes are omitted as appropriate.

formatMilliseconds(500) ~~> "00:500"
formatMilliseconds(5000) ~~> "05:000"
formatMilliseconds(500000) ~~> "08:20:000"
formatMilliseconds(5000000) ~~> "01:23:20:000"

formatMilliseconds(500, 1) ~~> "500"
formatMilliseconds(500, 3) ~~> "00:00:500"
formatMilliseconds(500, 4) ~~> "00:00:00:500"
* */

export function formatMilliseconds(ms, minSegments = 2) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  return (
    (hr || minSegments >= 4 ? hr.toString().padStart(2, '0') + ':' : '') +
    (min || minSegments >= 3 ? (min % 60).toString().padStart(2, '0') + ':' : '') +
    (sec || minSegments >= 2 ? (sec % 60).toString().padStart(2, '0') + ':' : '') +
    Math.floor(ms % 1000)
      .toString()
      .padStart(3, '0')
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
    stdDev: Math.sqrt(times.reduce((s, t) => s + (t - avgTime) ** 2, 0) / (n - 1)),
    result,
  };
}

/* Maps a function over a range of integers without generating an intermediate array
mapLength(n, f) ~~> [ f(0), f(1), ..., f(floor(n-1)) ] if n >= 1
                    [ f(0), f(-1), ..., f(ceil(n+1)) ] if n <= -1
                    [ ]                                otherwise
Saves memory over range(n).map(f)
*/
export function mapLength(n, f) {
  return Array.from({length: Math.abs(n)}, n >= 0 ? (_, i) => f(i) : (_, i) => f(-i));
}

/* Gets the specified properties of an object as an array, with optional transformation.
 takeValues(obj, [k1, k2, ...]) ~~> [ obj[k1], obj[k2], ... ]
 takeValues(obj, [k1, k2, ...], f) ~~> [ f(obj[k1], k1), f(obj[k2], k2), ... ]
*/
export function takeValues(obj, keys, f = identity) {
  return keys.map((k) => f(obj[k], k));
}
