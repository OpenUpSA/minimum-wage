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

    $('#meal-options').on('change', function() {
      household.updateMealOption();
    });

    function Household() {
      var self = this;

      /*
      Food Costs:
      1: Food poverty line
      2. PACSA minimum nutrional basket (10 500 kJ a day - June 2017)
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
        meals.updateCoverage();
      };

      self.updateMembers = function(e) {
        self.members = e.value;
        meals.updateCoverage();
      };

      self.updateMealOption = function () {
        self.mealOption = parseInt($("input[name='meal-option']:checked").val());
        meals.updateCoverage();
      }

    }

    function Meals() {
      var self = this;
      var qMeals = 3;

      self.costCoverage = calcCoverage();
      drawPlates();

      self.updateCoverage = function() {
        self.costCoverage = calcCoverage();
        drawPlates();
      };

      function calcCoverage() {
        var foodCost = household.foodCosts[household.mealOption];
        var coverage = (household.income / household.members) / foodCost;
        return (coverage > 1) ? 1 : coverage;
      }

      function drawPlates() {
        var plates = $('#meals').find('.plate');
        var portions = self.costCoverage * qMeals;
        var platePortion = 0;

        var width,
            height;

        var src = (window.location.origin + window.location.pathname).replace("index.html", "");
        var plateImage = src + "img/plate.svg";

        var gridLength = qMeals;

        var svg1 = d3.select("svg").remove();
        var svg = d3.select("#meals").append("svg");

        var defs = svg.append("defs");

        var angleGrid = [];

        // Create data object
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

          // $(plate).text(platePortion);

          var angleObj = {
            angle: 1 - platePortion,
          };
          angleGrid.push(angleObj);
        });

        render();

       function render() {

          //get dimensions based on width of container element
          updateDimensions($("#meals")[0].clientWidth);

          var initialPosition = { x: width / 7, y: width / 7 };
          // var circleSize = { width: 150, height: 150 };
          // var spacing = {h: 30, v: 70};
          var circleSize = { width: width / 3.5, height: width / 3.5 };
          var spacing = {h: width / 20, v: width / 10};

          var path = d3.arc()
          .outerRadius(circleSize.width / 2)
          .innerRadius(0)
          .startAngle(0);

          var generateArc = function(fraction) {
            return path({endAngle: Math.PI * 2 * fraction})
          };

          svg.attr("width", width).attr("height", height);

          var coinPattern = patternGrid.circleLayout()
            .config({
              image: plateImage,
              radius: circleSize.width,
              padding: [spacing.h, spacing.v],
              margin: [initialPosition.y, initialPosition.x],
              id: "plate"
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
            .attr("fill", "url(#plate");

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

          // //update svg elements to new dimensions
          // svg
          //   .attr('width', width + margin.right + margin.left)
          //   .attr('height', height + margin.top + margin.bottom);
          // chartWrapper.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        }

        function updateDimensions(containerWidth) {
          width = containerWidth;
          height = containerWidth < 300 ? 100 : (containerWidth / 3);
        }

        // return {
        //   render : render
        // }
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
