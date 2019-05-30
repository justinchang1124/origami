// The goal of all of this javascript is to make two square canvases:
// selector / confirmer on top: these are the user tools
// paper / result in the middle: this is the origami before / after the suggested fold or cut
// background / background: these have zero javascript and are just there to ensure contrast.
var selectorContext = document.getElementById('selector').getContext("2d");
var paperContext = document.getElementById('paper').getContext("2d");
var resultContext = document.getElementById('result').getContext("2d");
var confirmerContext = document.getElementById('confirmer').getContext("2d");
// selector constants
var numberOfSelectedPoints;
var point1;
var point2;
// The displaced origin of the paper.
var originPaper;
// The zoom factor; starts at zoom = 1
var zoom;
// The previous position ofthe mouse (used to drag)
var previousMouse;
// unselected = 0, point1 = 1, point2 = 2, originPaper = 3
var dragging;
// unselected = 0, fold = 1, cut = 2
var foldCut;
// The current set of paper polygons in this origami
var paperLayers;
// The future (pre-calculated) set of paper polygons in this origami
var resultLayers;
// Whether or not the current fold or cut can be performed.
var confirmable;
// The degree of coloring
var colorFactor = 0.5;

// List of all events: https://www.w3schools.com/jsref/dom_obj_event.asp
// How to add an event listener:
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
selector.addEventListener("mousedown", mouseDown);
selector.addEventListener("mousemove", mouseMove);
selector.addEventListener("dblclick", selectorClick);
confirmer.addEventListener("dblclick", confirmerClick);

// If an event listener is added, make sure to link a disabler:
if (selector.addEventListener)
  selector.addEventListener("mousedown", disabler);
else
  selector.addEventListener("onselectstart", disabler);

// If an event listener is added, make sure to link a disabler:
if (confirmer.addEventListener)
  confirmer.addEventListener("mousedown", disabler);
else
  confirmer.addEventListener("onselectstart", disabler);

// Solidly Stated tutorial: http://solidlystated.com/scripting/proper-way-to-disable-text-selection-and-highlighting/
// From what I understand, it will either prevent the default or return false (thus stopping the onselectstart action of highlighting)
function disabler(event) {
  if (event.preventDefault) {
    event.preventDefault();
  }
  return false;
}

// Let's make a button! It's just appearance ... no clickability.
// (x,y) is top left corner, w = width, h = height
function makeButton(x, y, w, h, text, color, context) {
  context.beginPath();
  context.rect(x + 1, y + 1, w - 2, h - 2);
  context.fillStyle = color;
  context.fill();
  context.beginPath();
  context.fillStyle = "rgba(0,0,0,1)";
  context.rect(x + 0.5, y + 0.5, w - 2, h - 2);
  context.stroke();
  context.rect(x + 1.5, y + 1.5, w - 4, h - 4);
  context.stroke();
  // https://www.w3schools.com/tags/ref_canvas.asp: this site is (again) a miracle!
  context.textAlign = "center";
  context.font = "24px Times";
  context.fillText(text, x + w / 2, y + h / 2 + 6);
}

// Sets selector colors! These are just my personal preference in terms of what looks good.
function setSelectorColorDark() {
  if (foldCut == 0)
    selectorContext.fillStyle = "rgba(255,255,255,1)";
  if (foldCut == 1)
    selectorContext.fillStyle = "rgba(0,127,0,1)";
  if (foldCut == 2)
    selectorContext.fillStyle = "rgba(127,0,0,1)";
}

// A lighter version of setSelectorColorDark.
function setSelectorColor() {
  if (foldCut == 0)
    selectorContext.fillStyle = "rgba(255,255,255,1)";
  if (foldCut == 1)
    selectorContext.fillStyle = "rgba(0,255,0,1)";
  if (foldCut == 2)
    selectorContext.fillStyle = "rgba(255,0,0,1)";
}

// Just toggling the acknowledgements!
$(document).ready(function(){
  $(".temp").click(function(){
    $(".temp").hide();
    $(".hidden").show();
  });

  $(".hidden").click(function(){
    $(".hidden").hide();
    $(".temp").show();
  });
});
