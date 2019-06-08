// Gets the position of a mouse relative to a canvas
function getMousePosition(canvas, event) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  // This grabs the rectangle that currently best surrounds our canvas.
  var rectangle = canvas.getBoundingClientRect();
  // https://www.w3schools.com/jsref/dom_obj_event.asp
  // clientX and clientY are properties that represent the x and y coordinates of the user's mouse.
  // Taking the difference between the cilent's position and the top-left corner of the canvas
  // yields the relative position of the user's mouse.
  return new Point(event.clientX - rectangle.left, event.clientY - rectangle.top);
}

// Manages all double clicks on the selector
function selectorClick(event) {
  var mousePosition = getMousePosition(selector, event);
  // two booleans: whether the mouse is over the zoom-out button or the zoom-in button.
  var zoomOut = mousePosition.overRectangle(new Point(520, 560), 30, 30);
  var zoomIn = mousePosition.overRectangle(new Point(560, 560), 30, 30);

  // zoom functionality
  if (zoomOut) {
    zoom *= 0.9;
    drawPaper();
    drawResult();
    drawConfirmer();
    return;
  }
  if (zoomIn) {
    zoom /= 0.9;
    drawPaper();
    drawResult();
    drawConfirmer();
    return;
  }

  // If nothing is on the screen: add a point, redraw the selector, and finish.
  if (numberOfSelectedPoints == 0) {
    point1 = mousePosition;
    numberOfSelectedPoints++;
    drawSelector();
    return;
  }

  // the clear button resets the selector
  var clearButton = mousePosition.overRectangle(new Point(10, 10), 120, 30);
  // the fold button sets the tool to folding mode
  var foldButton = mousePosition.overRectangle(new Point(140, 10), 120, 30);
  // the cut button sets the tool to cutting mode
  var cutButton = mousePosition.overRectangle(new Point(270, 10), 120, 30);

  // if none of the buttons are being touched and only one point is on the screen,
  // add another point and redraw everything.
  if (!clearButton && !foldButton && !cutButton && numberOfSelectedPoints == 1) {
    point2 = mousePosition;
    numberOfSelectedPoints++;
    // They will always be drawn/cleard in this order; selector must come after paper,
    // result must come after selector, confirmer must come after result.
    drawPaper();
    drawSelector();
    drawResult();
    drawConfirmer();
    return;
  }

  if (clearButton) {
    clearSelector();
    return;
  }

  if (foldButton) {
    // If the button is already selected, unselect it. Otherwise select it.
    if (foldCut != 1)
      foldCut = 1;
    else
      foldCut = 0;

    drawSelector();
    drawResult();
    drawConfirmer();
    return;
  }
  if (cutButton) {
    // If the button is already selected, unselect it. Otherwise select it.
    if (foldCut != 2)
      foldCut = 2;
    else
      foldCut = 0;

    drawSelector();
    drawResult();
    drawConfirmer();
    return;
  }
}

// Manages all double clicks on the confirmer
function confirmerClick(event) {
  var mousePosition = getMousePosition(confirmer, event);
  // Have two points been selected?
  // Is it confirmable in terms of fold / cut elegibility?
  // Is the mouse over the button?
  // Does the user actually want to fold or cut?
  var canBeConfirmed = numberOfSelectedPoints == 2 && confirmable &&
    mousePosition.overRectangle(new Point(200, 275), 200, 50) && foldCut > 0;

  if (canBeConfirmed) {
    // Make the calculated result the new paperLayers
    paperLayers = resultLayers;
    drawPaper();
    clearSelector();
    drawResult();
    confirmable = false;
    drawConfirmer();
  }
}

// Is fired every time the mouse goes down.
function mouseDown(event) {
  var mousePosition = getMousePosition(selector, event);

  // If it's not the left mouse button, leave!
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  if (event.button != 0)
    return;

  // By default, assume that the paper is being dragged.
  dragging = 3;
  previousMouse = mousePosition;

  // Otherwise, check if a point is being dragged.
  if (mousePosition.overCircle(point1, 20))
    dragging = 1;

  if (numberOfSelectedPoints == 2 && mousePosition.overCircle(point2, 20))
    dragging = 2;
}

// Is fired when the mouse is lifted at any point on the screen.
// If the mouse isn't down, dragging must not be happening!
function mouseUp() {
  dragging = 0;
}

// Is fired every time the mouse moves.
function mouseMove(event) {
  var mousePosition = getMousePosition(selector, event);

  // If nothing is being dragged, quit.
  if (dragging == 0)
    return;

  // If either of the points are being dragged ...
  if (dragging == 1) {
    point1 = mousePosition;
    drawSelector();
    // If the folding or cutting tool is active, update the result.
    if (foldCut > 0) {
      drawResult();
      drawConfirmer();
    }
  }

  if (dragging == 2) {
    point2 = mousePosition;
    drawSelector();
    // If the folding or cutting tool is active, update the result.
    if (foldCut > 0) {
      drawResult();
      drawConfirmer();
    }
  }

  // If the paper is being dragged ...
  if (dragging == 3) {
    // Displace the paper by how much the mouse has moved
    // since the last mouse position update
    originPaper.x -= previousMouse.x - mousePosition.x;
    originPaper.y -= previousMouse.y - mousePosition.y;
    // Update the position of the mouse
    previousMouse = mousePosition;
    drawPaper();
    drawResult();
    drawConfirmer();
  }
}
