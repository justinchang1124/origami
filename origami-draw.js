// This clears the zoom/dragging function.
function clearZoom() {
  originPaper = new Point(300, 300);
  zoom = 1;
  previousMouse = -1;
  dragging = 0;
}

// This essentially resets the selector.
function clearSelector() {
  numberOfSelectedPoints = 0;
  foldCut = 0;
  point1 = new Point(0, 0);
  point2 = new Point(0, 0);
  dragging = 0;
  drawSelector();
}

// these ones are really grouped together, so it's difficult
// to separate the functions out without making them stubs
function clearPaperResultConfirmer() {
  paperLayers = [];
  resultLayers = [];
  confirmable = false;
  var sheetOfPaper = new Polygon([new Point(50, 50), new Point(50, 550), new Point(550, 550), new Point(550, 50)]);
  paperLayers.push(sheetOfPaper);
  drawPaper();
  drawResult();
  drawConfirmer();
}

// Resets the entire system.
function clear() {
  clearZoom();
  clearSelector();
  clearPaperResultConfirmer();
}

// Below are all the drawing functions. They come from:
// https://www.w3schools.com/tags/ref_canvas.asp

// Draws the origami on the left.
function drawPaper() {
  paperContext.beginPath();
  paperContext.clearRect(0, 0, 600, 600);

  // We now make a color gradient ... darker colors the further away the sheet of paper
  var fragment = Math.floor(255 / paperLayers.length / 2);
  var startingPoint = 255 - (paperLayers.length - 1) * fragment;

  for (var i = 0; i < paperLayers.length; i++) {
    paperContext.beginPath();
    var color = startingPoint + i * fragment;
    paperContext.fillStyle = "rgba(" + color / 2 + "," + color / 2 + "," + color + ",0.95)";
    // Now draw!
    paperLayers[i].draw(paperContext);
  }
}

// Draws the selector tool ... mostly a lot of small details.
function drawSelector() {
  selectorContext.clearRect(0, 0, selector.width, selector.height);

  if (numberOfSelectedPoints == 1) {
    // point 1
    selectorContext.beginPath();
    selectorContext.arc(point1.x, point1.y, 10, 0, 2 * Math.PI);
    setSelectorColorDark();
    selectorContext.fill();
    selectorContext.stroke();
  }

  if (numberOfSelectedPoints == 2) {
    var vecX = (-point1.x + point2.x) / distance(point1, point2);
    var vecY = (-point1.y + point2.y) / distance(point1, point2);
    var meanX = (point1.x + point2.x) / 2;
    var meanY = (point1.y + point2.y) / 2;
    // line
    selectorContext.beginPath();
    selectorContext.fillStyle = "rgba(0,0,0,1)";
    selectorContext.moveTo(point1.x, point1.y);
    selectorContext.lineTo(point2.x, point2.y);
    selectorContext.stroke();
    // black triangle
    selectorContext.beginPath();
    selectorContext.fillStyle = "rgba(0,0,0,1)";
    // This is the construction of an equilateral triangle!
    selectorContext.moveTo(meanX + vecX * 10, meanY + vecY * 10);
    selectorContext.lineTo(meanX - vecX * 10, meanY - vecY * 10);
    selectorContext.lineTo(meanX + vecY * 10 * Math.sqrt(3), meanY - vecX * 10 * Math.sqrt(3));
    selectorContext.lineTo(meanX + vecX * 10, meanY + vecY * 10);
    selectorContext.fill();
    selectorContext.beginPath();
    setSelectorColor();
    selectorContext.stroke();
    // This is the construction of another equilateral triangle!
    selectorContext.moveTo(meanX + vecX * 10, meanY + vecY * 10);
    selectorContext.lineTo(meanX - vecX * 10, meanY - vecY * 10);
    selectorContext.lineTo(meanX - vecY * 10 * Math.sqrt(3), meanY + vecX * 10 * Math.sqrt(3));
    selectorContext.lineTo(meanX + vecX * 10, meanY + vecY * 10);
    selectorContext.fill();
    selectorContext.fillStyle = "rgba(0,0,0,1)";
    selectorContext.stroke();
    // point 1
    selectorContext.beginPath();
    selectorContext.arc(point1.x, point1.y, 10, 0, 2 * Math.PI);
    selectorContext.fillStyle = "rgba(0,0,0,1)";
    selectorContext.fill();
    selectorContext.stroke();
    // point 2
    selectorContext.beginPath();
    setSelectorColor();
    selectorContext.arc(point2.x, point2.y, 10, 0, 2 * Math.PI);
    selectorContext.fill();
    selectorContext.stroke();
  }

  // clear, fold, cut, buttons
  if (numberOfSelectedPoints > 0) {
    makeButton(10, 10, 120, 30, "Clear", "rgba(255,255,255,0.5)", selectorContext);
    if (foldCut == 0) {
      makeButton(140, 10, 120, 30, "Fold", "rgba(255,255,255,0.5)", selectorContext);
      makeButton(270, 10, 120, 30, "Cut", "rgba(255,255,255,0.5)", selectorContext);
    }
    if (foldCut == 1) {
      makeButton(140, 10, 120, 30, "Fold", "rgba(0,255,0,0.5)", selectorContext);
      makeButton(270, 10, 120, 30, "Cut", "rgba(255,255,255,0.5)", selectorContext);
    }
    if (foldCut == 2) {
      makeButton(140, 10, 120, 30, "Fold", "rgba(255,255,255,0.5)", selectorContext);
      makeButton(270, 10, 120, 30, "Cut", "rgba(255,0,0,0.5)", selectorContext);
    }
  }

  // zoom buttons
  makeButton(520, 560, 30, 30, "−", "rgba(255,255,255,0.5)", selectorContext);
  makeButton(560, 560, 30, 30, "+", "rgba(255,255,255,0.5)", selectorContext);
}

// draws the result on the right side ... this one is where the math is really crazy!!
function drawResult() {
  resultContext.beginPath();
  resultContext.clearRect(0, 0, 600, 600);

  // resultLayers should start as a perfect copy of paperLayers
  resultLayers = [];
  for (var i = 0; i < paperLayers.length; i++) {
    var copiedLayer = paperLayers[i].copy();
    resultLayers.push(copiedLayer);
  }

  // p1t = point 1 transform, p2t = point 2 transform
  var p1t = zoomToPaper(point1);
  var p2t = zoomToPaper(point2);

  confirmable = true;

  for (var i = 0; i < resultLayers.length; i++) {
    if (!resultLayers[i].isConfirmable(p1t, p2t)) {
      confirmable = false;
    }
  }

  if (confirmable && numberOfSelectedPoints == 2) {
    // save the original length of the layers!
    var originalLength = resultLayers.length;
    // if we are folding ...
    if (foldCut == 1) {
      for (var i = originalLength - 1; i > -1; i--) {
        var intersections = resultLayers[i].getIntersections(p1t, p2t);
        var numberOfIntersections = resultLayers[i].getNumberOfIntersections(p1t, p2t);

        // If the polygon is entirely on the wrong side ...
        if (numberOfIntersections.length == 0 && orientation(p1t, p2t, resultLayers[i].points[0]) == 1) {
          // Flip all the points!
          var toBeFlippedPoints = resultLayers[i].points;
          var flippedPoints = [];
          for (var j = 0; j < toBeFlippedPoints.length; j++) {
            flippedPoints.push(reflect(toBeFlippedPoints[toBeFlippedPoints.length-1-j], p1t, p2t));
          }

          // The new, flipped polygon.
          var newPolygon = new Polygon(flippedPoints);
          // Since it's going to be flipped, remove the existing one.
          resultLayers.splice(i, 1);
          i++;
          // And add a new one!
          resultLayers.push(newPolygon);
        }

        // If we actually have to split into two parts and fold ...
        if (numberOfIntersections.length == 2) {
          // Theoretically speaking, a line should only intersect
          // our types of polygons in two places ... here are the corresponding indices.
          // Note that index1 < index2 always.
          var index1 = numberOfIntersections[0];
          var index2 = numberOfIntersections[1];

          // The points on the line segment that cover intersections[index1]
          var p11 = resultLayers[i].points[index1];
          var p12 = resultLayers[i].points[(index1 + 1) % resultLayers[i].points.length];
          // The points on the line segment that cover intersections[index2]
          var p21 = resultLayers[i].points[index2];
          var p22 = resultLayers[i].points[(index2 + 1) % resultLayers[i].points.length];

          // Splitting a polygon into two sets of points ... go! There are the points between
          // index1 / index2 (newPoints2) and the rest, which have to be consolidated.
          var newPoints1 = [];
          var newPoints2 = [];
          for (var j = 0; j < index1 + 1; j++)
            newPoints1.push(new Point(resultLayers[i].points[j].x, resultLayers[i].points[j].y));
          newPoints1.push(intersections[index1]);
          newPoints2.push(intersections[index1]);
          for (var j = index1 + 1; j <= index2; j++)
            newPoints2.push(new Point(resultLayers[i].points[j].x, resultLayers[i].points[j].y));
          newPoints2.push(intersections[index2]);
          newPoints1.push(intersections[index2]);
          for (var j = index2; j < resultLayers[i].points.length; j++)
            newPoints1.push(new Point(resultLayers[i].points[j].x, resultLayers[i].points[j].y));

          // olde points stay, fold points have to be folded.
          // Depending on the direction of the colored arrow in the selector ...
          var oldePoints;
          var foldPoints;
          if (orientation(p1t, p2t, p11) == 1) {
            oldePoints = newPoints2;
            foldPoints = newPoints1;
          }

          if (orientation(p1t, p2t, p11) == 2) {
            oldePoints = newPoints1;
            foldPoints = newPoints2;
          }

          // replace the existing polygon with what remains
          resultLayers[i] = new Polygon(oldePoints);

          var flippedPoints = [];
          for (var j = 0; j < foldPoints.length; j++) {
            // reverse the order! Imagine flipping a sheet ...
            flippedPoints.push(reflect(foldPoints[foldPoints.length - 1 - j], p1t, p2t));
          }

          var newPolygonFlipped = new Polygon(flippedPoints);
          resultLayers.push(newPolygonFlipped);
        }
      }
    }
    if (foldCut == 2) {
      for (var i = 0; i < originalLength; i++) {
        var intersections = resultLayers[i].getIntersections(p1t, p2t);
        var numberOfIntersections = resultLayers[i].getNumberOfIntersections(p1t, p2t);

        // If the polygon is entirely on the wrong side ...
        if (numberOfIntersections.length == 0 && orientation(p2t, p2t, resultLayers[i].points[0]) == 1) {
          // Remove the existing one.
          resultLayers.splice(i, 1);
          i++;
        }

        // If we have to cut ...
        if (numberOfIntersections.length == 2) {
          var index1 = numberOfIntersections[0];
          var index2 = numberOfIntersections[1];

          // The points on the line segment that cover intersections[index1]
          var p11 = resultLayers[i].points[index1];
          var p12 = resultLayers[i].points[(index1 + 1) % resultLayers[i].points.length];
          // The points on the line segment that cover intersections[index2]
          var p21 = resultLayers[i].points[index2];
          var p22 = resultLayers[i].points[(index2 + 1) % resultLayers[i].points.length];

          // Splitting a polygon into two sets of points ... go! There are the points between
          // index1 / index2 (newPoints2) and the rest, which have to be consolidated.
          var newPoints1 = [];
          var newPoints2 = [];
          for (var j = 0; j < index1 + 1; j++)
            newPoints1.push(new Point(resultLayers[i].points[j].x, resultLayers[i].points[j].y));
          newPoints1.push(intersections[index1]);
          newPoints2.push(intersections[index1]);
          for (var j = index1 + 1; j <= index2; j++)
            newPoints2.push(new Point(resultLayers[i].points[j].x, resultLayers[i].points[j].y));
          newPoints2.push(intersections[index2]);
          newPoints1.push(intersections[index2]);
          for (var j = index2; j < resultLayers[i].points.length; j++)
            newPoints1.push(new Point(resultLayers[i].points[j].x, resultLayers[i].points[j].y));

          // olde points stay, fold points are cut out in this case.
          // Depending on the direction of the colored arrow in the selector ...
          var oldePoints;

          if (orientation(p1t, p2t, p11) == 1)
            oldePoints = newPoints2;

          if (orientation(p1t, p2t, p11) == 2)
            oldePoints = newPoints1;

          // A new polygon with the old points ... how ironic
          resultLayers[i] = new Polygon(oldePoints);
        }
      }
    }
  }

  // We now make a color gradient ... darker colors the further away the sheet of paper
  var fragment = Math.floor(255 / resultLayers.length / 2);
  var startingPoint = 255 - (resultLayers.length - 1) * fragment;

  for (var i = 0; i < resultLayers.length; i++) {
    resultContext.beginPath();
    var color = startingPoint + i * fragment;
    resultContext.fillStyle = "rgba(" + color / 2 + "," + color / 2 + "," + color + ",0.95)";
    // Now draw!
    resultLayers[i].draw(resultContext);
  }
}

// Now for the confirmer button!
function drawConfirmer() {
  confirmerContext.clearRect(0, 0, confirmer.width, confirmer.height);

  if (numberOfSelectedPoints == 2 && foldCut > 0) {
    if (confirmable)
      makeButton(200, 275, 200, 50, "Confirm?", "rgba(255,255,255,1)", confirmerContext);
    else
      makeButton(200, 275, 200, 50, "Invalid Fold/Cut", "rgba(255,255,255,1)", confirmerContext);
  }
}
