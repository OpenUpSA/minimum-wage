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

    $('#show-basket').on('click', function() {
      $('#basket').css('display', 'block');
      pymChild.sendHeight();
      var sticky = new Sticky('#summary');
    });

    household.incomeSlider.on('slideStop', household.updateIncome);
    household.memberSlider.on('slideStop', household.updateMembers);

    $('#meal-options').on('change', function() {
      household.updateMealOption();
    });

    // Redraw plates on resize
    $(window).on('resize', function() {
      meals.drawPlates();
    });

    function Household() {
      var self = this;

      /*
      Food Costs:
      1: Food poverty line
      2. PACSA minimum nutritional basket (10 500 kJ a day - June 2017)
      */

      self.foodCosts = {
        '1': 498,
        '2': 635,
      };

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
      self.mealOption = parseInt($("input[name='meal-option']:checked").val());

      self.updateIncome = function(e) {
        self.income = e.value;
        meals.updateCostCoverage();
      };

      self.updateMembers = function(e) {
        self.members = e.value;
        meals.updateCostCoverage();
      };

      self.updateMealOption = function () {
        self.mealOption = parseInt($("input[name='meal-option']:checked").val());
        meals.updateCostCoverage();
      };

    }

    function Meals() {
      var self = this;
      var dailyMeals = 3;
      var plateData = [];

      var round = function(value, decimals) {
        // decimals = 0 if not passed
        decimals = typeof decimals !== 'undefined' ? decimals : 0;
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
      };

      self.drawPlates = function () {
        var width,
            height;

        // Use window location to build image src
        var src = (window.location.origin + window.location.pathname).replace("index.html", "");
        var plateImage = src + "img/plate.svg";

        var gridLength = dailyMeals;

        var svg1 = d3.select("svg").remove();
        var svg = d3.select("#plates").append("svg");

        var defs = svg.append("defs");

        //get dimensions based on width of container element
        function updateDimensions(containerWidth) {
          width = containerWidth;
          height = containerWidth < 300 ? 100 : (containerWidth / 3);
        }

        updateDimensions($("#plates")[0].clientWidth);
        svg.attr("width", width).attr("height", height);

        var initialPosition = { x: width / 6, y: width / 7 };
        var circleSize = { width: width / 3.5, height: width / 3.5 };
        var spacing = {h: width / 20, v: width / 10};

        var path = d3.arc()
          .outerRadius(circleSize.width / 2)
          .innerRadius(0)
          .startAngle(0);

        var coinPattern = patternGrid.circleLayout()
          .config({
            image: plateImage,
            radius: circleSize.width,
            padding: [spacing.h, spacing.v],
            margin: [initialPosition.y, initialPosition.x],
            id: "plate"
        });

        var generateArc = function(fraction) {
          return path({endAngle: Math.PI * 2 * fraction})
        };

        // Assign plate positions
        plateData.forEach(function(plate, i) {
          plate.x = i % gridLength;
          plate.y = Math.floor(i / gridLength);
        });

        var circles = svg.append("g")
          .selectAll("circle")
          .data(plateData)
        .enter().append("circle")
          .attr("class", "plate-circle")
          .attr("cx", function(d) {
            return initialPosition.x + (circleSize.width + spacing.h) * d.x;
          })
          .attr("cy", function(d) {
            return initialPosition.y + (circleSize.height + spacing.v) * d.y;
          })
          .attr("r", circleSize.width / 2)
          .attr("fill", "url(#plate)");

        var arcs = svg.append("g")
          .selectAll("path")
          .data(plateData.filter(function(d) { return d.angle; }))
        .enter().append("path")
          .attr("transform", function(d) {
            var xPos = initialPosition.x + (circleSize.width + spacing.h) * d.x;
            var yPos = initialPosition.y + (circleSize.height + spacing.v) * d.y;
            return "translate(" + xPos + ", " + yPos + ")";
          })
          .attr("class", "pie-segment")
          .attr("d", function(d) {
            return generateArc(d.angle);
          });
      };

      self.updateCostCoverage = function() {
        self.costCoverage = calcCoverage();
        plateData = compilePlates();
        self.drawPlates();
        updateSummary();
      };

      function updateSummary() {
        self.residual = calcResidual();
        drawSummary();
      }

      self.costCoverage = self.updateCostCoverage();

      function calcCoverage() {
        // Returns the ratio (0-1) to which income covers the cost of the food basket.
        var foodCost = household.foodCosts[household.mealOption];
        var coverage = (household.income / household.members) / foodCost;
        return (coverage > 1) ? 1 : coverage;
      }

      function compilePlates() {
        var mealsADay = self.costCoverage * dailyMeals;
        var platePortion = 0;
        var plateGrid = [];

        // Create data object
        for (var i=0; i < dailyMeals; i++) {
          if (mealsADay >= 1) {
            platePortion = 1;
            mealsADay -= 1;
          }
          else {
            platePortion = mealsADay;
            mealsADay -= mealsADay;
          }

          var plateObj = {
            angle: 1 - platePortion,
          };
          plateGrid.push(plateObj);
        }

        return plateGrid;
      }

      function calcResidual() {
        var residual = household.income - (household.foodCosts[household.mealOption] * household.members);
        // return (residual > 0) ? residual : 0;
        return residual;
      }

      function drawSummary() {
        var mealSummary = {
          0: "Household members are getting three meals a day.",
          1: "Household members are getting less than three meals a day."
        };

        $('#residual').find('.amount')
          .text("R " + (self.residual > 0 ? round(self.residual, 0) : 0))
          .removeClass('warning').addClass(self.residual > 0 ? "" : "warning");

        $('#meals').find('.description').text(self.costCoverage === 1 ? mealSummary[0] : mealSummary[1]);
        $('#meals').removeClass('warning').addClass(self.costCoverage < 1 ? "warning" : "");

        $('#meals').find(self.costCoverage === 1 ? '.safe' : '.warning').css('display', 'block');
        $('#meals').find(self.costCoverage === 1 ? '.warning' : '.safe').css('display', 'none');

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
