// Even though we're just working with points and slopes,
// turning these concepts into code proved relatively difficult!

// Let's start with a constructor for a point:
function Point(x, y) {
  this.x = x;
  this.y = y;

  // Let's make a method to see if a point is within a circle.
  this.overCircle = function(center, radius) {
    // This is whether (delta x)^2 + (delta y)^2 <= r^2
    return distanceSquared(center, this) <= radius * radius;
  }

  // Let's make something similar for a rectangle
  // w = width, h = height, topLeft is the top left corner
  this.overRectangle = function(topLeft, w, h) {
    return topLeft.x <= this.x && this.x <= topLeft.x + w && topLeft.y <= this.y && this.y <= topLeft.y + h;
  }
}

// Now we need the distance. But square roots are computationally expensive,
// so let's stick with the square of the distance to start.
function distanceSquared(point1, point2) {
  var xDist = point1.x - point2.x;
  var yDist = point1.y - point2.y;
  return xDist * xDist + yDist * yDist;
}

// Now let's get the actual distance.
function distance(point1, point2) {
  return Math.sqrt(distanceSquared(point1, point2));
}

// Gets the intersection point of line segment 12 and line segment 34
// Returns false if there is not an intersection point or if the intersection is a line segment.
// This particular implementation was inspired by http://paulbourke.net/geometry/pointlineplane/javascript.txt
// but I have done a similar trick in the past for 3d rasterization
function getIntersection(p1, p2, p3, p4) {
  // The length of the cross product between 34 and 21,
  // aka double the area of the triangle formed by those two vectors lined up (signed)
  var denominator = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  // Cross product is only zero if the two vectors are parallel!
  if (denominator == 0) {
    return false;
  }

  // The length of the cross product of 34 and 31, aka double the area of 134 (signed), divided by denominator
  var cp3431 = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
  // The length of the cross product of 12 and 31, aka double the area of 123 (signed)
  var cp1231 = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;

  // If any of these are true, then the signed areas are either opposite
  // or a supposedly smaller triangle is much larger!
  if (cp3431 < 0 || cp3431 > 1 || cp1231 < 0 || cp1231 > 1) {
    return false;
  }

  // similar triangles to the rescue!
  return new Point(p1.x + cp3431 * (p2.x - p1.x), p1.y + cp3431 * (p2.y - p1.y));
}

// Transforms a point from the stored form to how it is displayed with zoom and displacement.
function paperToZoom(point) {
  return new Point((point.x - 300) * zoom + originPaper.x, (point.y - 300) * zoom + originPaper.y);
}

// Turns a zoomed and displaced point back into a paper-storage point.
function zoomToPaper(point) {
  return new Point((point.x - originPaper.x) / zoom + 300, (point.y - originPaper.y) / zoom + 300);
}

// Inspired by:
// https://www.geeksforgeeks.org/orientation-3-ordered-points/
// returns 0 if b lies on the line formed by a, c
// returns 1 if a --> b --> c is clockwise
// returns 2 if a --> b --> c is counterclockwise
function orientation(a, b, c) {
  // Once more, we use the power of the signed cross product of bc x ab!
  // It's positive if clockwise, negative if counterclockwise!
  var crossProduct = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);

  if (crossProduct == 0)
    return 0;

  if (crossProduct > 0)
    return 1;
  return 2;
}

// Let's make a polygon object!
function Polygon(points) {
  // It should have an array that represents the points in it.
  this.points = [];

  // Let's draw it on a context! We won't begin the path
  // since we don't want to store colors here ...
  this.draw = function(context) {
    if (points.length > 2) {
      var start = paperToZoom(points[0]);
      context.moveTo(start.x, start.y);
      for (var i = 1; i < points.length; i++) {
        var current = paperToZoom(points[i]);
        context.lineTo(current.x, current.y);
      }
      context.lineTo(start.x, start.y);
      context.fill();
      context.fillStyle = "black";
      context.stroke();
    }
  }

  // This is what we can do to copy our Polygon for resultLayers!
  this.copy = function() {
    var copiedPoints = [];
    for (var i = 0; i < this.points.length; i++)
      copiedPoints.push(new Point(this.points[i].x, this.points[i].y));
    return new Polygon(copiedPoints);
  }

  // Returns the intersections with indices of this polygon with the line p1, p2
  this.getIntersections = function(p1, p2) {
    var intersections = [];

    // All the intersection points for each
    for (var i = 0; i < points.length; i++) {
      var point = getIntersection(p1, p2, points[i], points[(i + 1) % points.length]);
      if (!(point === false))
        intersections.push(new PointIndex(point, i));
    }

    return intersections;
  }

  // counterclockwise always
  if (orientation(points[0], points[1], points[2]) == 2) {
    for (var i = points.length - 1; i > -1; i--)
      this.points.push(points[i]);
  } else {
    for (var i = 0; i < points.length; i++)
      this.points.push(points[i]);
  }
}

/**
 * Obtained from https://bl.ocks.org/balint42/b99934b2a6990a53e14b
 *
 * Disclaimer: I checked the math at 2 AM, I believe that it works
 * (you need the squares since you are turning slopes from m to -1/m)
 *
 * Section below is from the source:
 *
 * @brief "Reflect point p along line through points p0 and p1
 *
 * @author Balint Morvai <balint@morvai.de>
 * @license http://en.wikipedia.org/wiki/MIT_License MIT License
 * @param p point to reflect
 * @param p0 first point for reflection line
 * @param p1 second point for reflection line
 * @return object"
 */
function reflect(p, p0, p1) {
  var dx = p1.x - p0.x;
  var dy = p1.y - p0.y;
  var a = (dx * dx - dy * dy) / distanceSquared(p0, p1);
  var b = 2 * dx * dy / distanceSquared(p0, p1);
  var x = a * (p.x - p0.x) + b * (p.y - p0.y) + p0.x;
  var y = b * (p.x - p0.x) - a * (p.y - p0.y) + p0.y;

  return new Point(x, y);
}

// Creates a point with its relative index in a polygon
function PointIndex(point, index) {
  this.point = point;
  this.index = index;
}
