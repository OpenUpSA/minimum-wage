(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.patternGrid = global.patternGrid || {}), global.d3));
}(this, function (exports,d3) { 'use strict';

  function circlePatternGridLayout() {

    var circleRadius = undefined;
    var spacing = { horizontal: 0, vertical: 0 };
    var margin = { top: 0, left: 0 };
    var imageUrl = undefined;
    var id = "patternGrid";

    var pattern = d3.select("defs").append("pattern")
      .attr('patternUnits', 'userSpaceOnUse');

    function circleLayout() {
      setAttributes();
      return circleLayout;
    }

    function setAttributes() {
      pattern.select("image").remove();

      pattern
        .attr("id", id)
        .attr("width", circleRadius + spacing.horizontal)
        .attr("height", circleRadius + spacing.vertical)
        .attr("x", margin.left + (circleRadius / 2) + spacing.horizontal)
        .attr("y", margin.top + (circleRadius / 2) + spacing.vertical)
        .append("image")
        .attr("xlink:href", imageUrl)
        .attr("width", circleRadius)
        .attr("height", circleRadius);
    }

    circleLayout.config = function(cfg) {
      if (cfg.image) {
        imageUrl = cfg.image;
      }
      if (cfg.radius) {
        circleRadius = cfg.radius;
      }
      if (cfg.padding) {
        spacing.horizontal = cfg.padding[0];
        spacing.vertical = cfg.padding[1];
      }
      if (cfg.margin) {
        margin.top = cfg.margin[0];
        margin.left = cfg.margin[1];
      }
      if (cfg.id) {
        id = cfg.id;
      }
      return circleLayout();
    };

    return circleLayout;
  }

  var version = "0.0.1";

  exports.version = version;
  exports.circleLayout = circlePatternGridLayout;
}));
