// Global vars

var { COLORS, makeTranslate, classify, formatStyle, fmtComma } = require("./lib/helpers");

var pym = require("./lib/pym");
require("./lib/webfonts");
var pymChild;

// Initialize the graphic.
var onWindowLoaded = function() {
  
  pym.then(child => {
    pymChild = child;
    child.sendHeight();
  });
};


// Initially load the graphic
window.onload = onWindowLoaded;
