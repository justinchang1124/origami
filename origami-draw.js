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

// Resets the entire system.
function clear() {
  clearZoom();
  clearSelector();
  previousStates = [];
  paperLayers = [];
  resultLayers = [];
  confirmable = false;
  var sheetOfPaper = new Polygon([new Point(50, 50), new Point(50, 550), new Point(550, 550), new Point(550, 50)]);
  paperLayers.push(sheetOfPaper);
  drawPaper();
  drawResult();
  drawConfirmer();
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
  makeButton(10, 560, 30, 30, "≈", "rgba(255,255,255,0.5)", selectorContext);
}

// draws the result on the right side ... this one is where the math is really crazy!!
function drawResult() {
  resultContext.beginPath();
  resultContext.clearRect(0, 0, 600, 600);

  // p1t = point 1 transform, p2t = point 2 transform
  var p1t = zoomToPaper(point1);
  var p2t = zoomToPaper(point2);
  // start with resultLayers as a perfect copy
  resultLayers = paperLayers;
  var allIntersections = [];

  confirmable = true;
  for (var i = 0; i < paperLayers.length && confirmable == true; i++) {
    var currentIntersections = paperLayers[i].getIntersections(p1t, p2t);

    // If the number of intersections between the selector
    // and this polygon isn't even, quit.
    if (currentIntersections.length % 2 != 0) {
      confirmable = false;
      break;
    }

    allIntersections.push(currentIntersections);
  }

  // If a cutting tool is selected and 2 valid points have been selected ...
  if (confirmable && numberOfSelectedPoints == 2 && foldCut > 0) {
    // make resultLayers empty since we will rebuild it
    resultLayers = [];

    // starting from the top layer of paperLayers and going down ...
    for (var i = paperLayers.length - 1; i > -1; i--) {
      // find all intersections between the current polygon and the selector line
      var numIntersects = allIntersections[i].length;
      // just a shortcut to make it easier to type
      var points = paperLayers[i].points;

      // The points of the polygon section on the colored triangle's side
      var colorPoints = [];
      // The points of the polygon section on the black triangle's side
      var blackPoints = [];

      // If the polygon is on one side ...
      if (numIntersects == 0) {
        // If the side is colored then keep it
        if (orientation(p1t, p2t, points[0]) == 2)
          for (var j = 0; j < points.length; j++)
            colorPoints.push(points[j]);
        // Otherwise add the reflected version to the black triangle's side
        else
          for (var j = 0; j < points.length; j++)
            blackPoints.push(reflect(points[j], p1t, p2t));
      }

      if (numIntersects == 2) {
        var inter1 = allIntersections[i][0].point;
        var inter2 = allIntersections[i][1].point;
        var index1 = allIntersections[i][0].index;
        var index2 = allIntersections[i][1].index;

        if (orientation(p1t, p2t, points[0]) == 2) {
          for (var j = 0; j <= index1; j++)
            colorPoints.push(points[j]);
          colorPoints.push(inter1);
          colorPoints.push(inter2);
          for (var j = index2 + 1; j < points.length; j++)
            colorPoints.push(points[j]);

          blackPoints.push(inter1);
          blackPoints.push(inter2);
          for (var j = index2; j > index1; j--)
            blackPoints.push(reflect(points[j], p1t, p2t));

        } else {
          colorPoints.push(inter2);
          colorPoints.push(inter1);
          for (var j = index1 + 1; j < index2 + 1; j++)
            colorPoints.push(points[j]);

          for (var j = points.length - 1; j > index2; j--)
            blackPoints.push(reflect(points[j], p1t, p2t));
          blackPoints.push(inter2);
          blackPoints.push(inter1);
          for (var j = index1; j > -1; j--)
            blackPoints.push(reflect(points[j], p1t, p2t));
        }
      }
      // I could add cases for concave polygons (where numIntersects > 2)
      // but that is very complicated and unlikely to occur
      if (blackPoints.length > 0 && foldCut == 1)
        resultLayers.push(new Polygon(blackPoints));

      if (colorPoints.length > 0)
        resultLayers.unshift(new Polygon(colorPoints));
    }
  }

  // We now make a color gradient ... darker colors the further away the sheet of paper
  var fragment = Math.floor(255 / resultLayers.length / 2);
  var startingPoint = 255 - (resultLayers.length - 1) * fragment;

  for (var i = 0; i < resultLayers.length; i++) {
    resultContext.beginPath();
    var color = startingPoint + i * fragment;
    resultContext.fillStyle = "rgba(" + color * colorFactor + "," + color * colorFactor + "," + color + ",0.95)";
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
