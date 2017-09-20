"use strict";

var pymChild = new pym.Child({
  id: "min-wage-embed-parent"
});

$(window).on('load', function() {
  pymChild.sendHeight();
});

(function($) {
  $(document).ready(function () {

    var household = new Household();
    var meals = new Meals();

    $('#go-shop').on('click', function() {
      $('#shop').css('display', 'block');
      pymChild.sendHeight();
      var sticky = new Sticky('#summary');
    });

    household.incomeSlider.on('slideStop', household.updateIncome);
    household.memberSlider.on('slideStop', household.updateMembers);

    function Household() {
      var self = this;

      self.incomeSlider = $('#hh-income').slider({
        formatter: function(value) {
          return value;
        },
        tooltip: 'always'
      });

      self.memberSlider = $('#hh-members').slider({
        formatter: function(value) {
          return value;
        },
        tooltip: 'always'
      });

      self.income = parseInt($('#hh-income').val());
      self.members = parseInt($('#hh-members').val());

      self.updateIncome = function(e) {
        self.income = e.value;
        meals.updateHelping();
      };

      self.updateMembers = function(e) {
        self.members = e.value;
        meals.updateHelping();
      };

    }

    function Meals() {
      var self = this;
      var meals = 3;
      var fpl = 498; // Food Poverty Line

      self.helping = calcHelping();

      drawPlates();

      self.updateHelping = function() {
        self.helping = calcHelping();
        drawPlates();
      };

      function calcHelping() {
        var helping = (household.income / household.members) / fpl;
        if (helping > 1) {
          return 1;
        }
        return helping;
      }

      function drawPlates() {
        var plates = $('#meals').find('.plate');
        var portions = self.helping * meals;
        var platePortion = 0;

        var width = "100%",
            height = 200;

        var plateImage = window.location.href + "img/plate.svg";

        var initialPosition = { x: 90, y: 95 };

        var circleSize = { width: 150, height: 150 };

        var spacing = {
          h: 30,
          v: 70
        };

        var gridLength = 3;

        var path = d3.arc()
          .outerRadius(circleSize.width / 2)
          .innerRadius(0)
          .startAngle(0);

        var generateArc = function(fraction) {
          return path({endAngle: Math.PI * 2 * fraction})
        }

        var svg1 = d3.select("svg").remove();

        var svg = d3.select("#meals").append("svg")
          .attr("width", width)
          .attr("height", height);

        var defs = svg.append("defs");

        var coinPattern = patternGrid.circleLayout()
        .config({
          image: plateImage,
          radius: circleSize.width,
          padding: [spacing.h, spacing.v],
          margin: [initialPosition.y, initialPosition.x],
          id: "plates"
        });

        var angleGrid = [];

        _.each(plates, function(plate) {
          if (portions - 1 >= 0) {
            platePortion = 1;
            portions -= 1;
          }
          else if (portions >= 0) {
            platePortion = portions;
            portions -= portions;
          }
          else {
            platePortion = 0;
          }

          $(plate).text(platePortion);

          var angleObj = {
            angle: 1 - platePortion,
          };
          angleGrid.push(angleObj);

        });

        // Assign positions
        angleGrid.forEach(function(a, i) {
          a.x = i % gridLength;
          a.y = Math.floor(i / gridLength);
        });

        var circles = svg.append("g")
          .selectAll("circle")
          .data(angleGrid)
        .enter().append("circle")
          .attr("class", "plate-circle")
          .attr("cx", function(d) {
            return initialPosition.x + (circleSize.width + spacing.h) * d.x;
          })
          .attr("cy", function(d) {
            return initialPosition.y + (circleSize.height + spacing.v) * d.y;
          })
          .attr("r", circleSize.width / 2)
          .attr("fill", "url(#plates");

        var arcs = svg.append("g")
          .selectAll("path")
          .data(angleGrid.filter(d => d.angle))
         .enter().append("path")
          .attr("transform", function(d) {
            var xPos = initialPosition.x + (circleSize.width + spacing.h) * d.x;
            var yPos = initialPosition.y + (circleSize.height + spacing.v) * d.y;
            return "translate(" + xPos + ", " + yPos + ")";
          })
          .attr("class", "pie-segment")
          .attr("d", d => generateArc(d.angle));

      }

    }

    function FoodBasket() {
      var self = this;

      self.cost = 0;
      self.kCal = 0;
      self.foods = {};

      var round = function(value, decimals) {
        // Decimals = 0 if not passed
        decimals = typeof decimals !== 'undefined' ? decimals : 0;
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
      };

      self.addToBasket = function(id) {
        if (id in self.foods) {
          self.foods[id] += 1;
        } else {
          self.foods[id] = 1;
        }
        calcTotals();
        draw(id);
      };

      self.removeFromBasket = function(id) {
        if (id in self.foods) {
          self.foods[id] -= 1;
          if (self.foods[id] === 0) {
            delete self.foods[id];
          }
        }
        calcTotals();
        draw(id);
      };

      function calcTotals() {
        totalCost();
        totalkCal();
      }

      function draw(id) {
        drawFoodQty(id);
        drawTotalCost();
        drawTotalkCal();
        drawCostToIncome();
      }

      function totalCost() {
        var total = 0;
        _.each(self.foods, function(qty, id) {
          var price = FOOD_DATA[id].price100g * (FOOD_DATA[id].weight / 100) * qty;
          total += price;
        });
        self.cost = total;
      }

       function totalkCal() {
        var total = 0;
        _.each(self.foods, function(qty, id) {
          var kCal = FOOD_DATA[id].kCal100g * (FOOD_DATA[id].weight / 100) * qty;
          total += kCal;
        });
        self.kCal = total;
      }

      function drawFoodQty(id) {
        if (id in self.foods) {
          $('#' + id).addClass('in-basket').find('.qty').text(self.foods[id]);
        } else {
          $('#' + id).removeClass('in-basket').find('.qty').text("");
        }
      }

      function drawTotalCost() {
        $('#total-cost').text(self.cost === 0 ? "" : "R " + round(self.cost, 2));
      }

      function drawTotalkCal() {
        $('#total-kCal').text(self.kCal === 0 ? "" : self.kCal + " kCal");
      }

      function drawCostToIncome() {
        $('#cost-to-income').text(self.cost === 0 ? "" : round((self.cost / household.income * 100), 2) + "%");
      }

    }

  });

})(jQuery);
