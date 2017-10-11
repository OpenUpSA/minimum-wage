"use strict";

var pymChild = new pym.Child({
  id: "min-wage-embed-parent"
});

$(window).on('load', function() {
  pymChild.sendHeight();
});

(function($) {

  $(document).ready(function () {

    // Redraw plates on resize
    $(window).on('resize', function() {
      meals.drawPlates();
      pymChild.sendHeight();
    });

    var round = function(value, decimals) {
      // decimals = 0 if not passed
      decimals = typeof decimals !== 'undefined' ? decimals : 0;
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    };

    var household = new Household();
    var meals = new Meals();

    household.incomeSlider.on('slideStop', household.updateIncome);
    household.memberSlider.on('slideStop', household.updateMembers);
    household.expenseSlider.on('slideStop', household.updateExpensePortion);

    $('#meal-options').on('change', household.updateMealOption);


    // Extra info boxes
    $('.intro-extra-info').on('click', function(e) {
      $('#intro').slideToggle();
      pymChild.sendHeight();
    });

    $('.hh-assumptions-extra-info').on('click', function(e) {
      $('#hh-assumptions-extra-info').find('#' + e.currentTarget.id).slideToggle();
      $('#hh-assumptions-extra-info').find('#' + e.currentTarget.id).siblings().slideUp();
      pymChild.sendHeight();
    });

    $('.results-extra-info').on('click', function(e) {
      $('#results-extra-info').find('#' + e.currentTarget.id).slideToggle();
      $('#results-extra-info').find('#' + e.currentTarget.id).siblings().slideUp();
      pymChild.sendHeight();
    });


    function Household() {
      var self = this;

      /* Cost of basic food per person per month:
         1: Stats SA Food poverty line
         2. PACSA minimum nutritional basket (10 500 kJ a day - June 2017) */

      var foodCostPerPerson = {
        '1': 508,
        '2': 635};

      var incomeDecileRanges = [
        {'range': [0, 800], 'percFood': 0.4813},
        {'range': [801, 1260], 'percFood': 0.4698},
        {'range': [1261, 1860], 'percFood': 0.3867},
        {'range': [1861, 2500], 'percFood': 0.317},
        {'range': [2501, 3152], 'percFood': 0.296},
        {'range': [3153, 4280], 'percFood': 0.2555},
        {'range': [4281, 6217], 'percFood': 0.2391},
        {'range': [6218, 10000], 'percFood': 0.2161},
        {'range': [10001, 20100], 'percFood': 0.1692},
        {'range': [20101, 100000], 'percFood': 0.1074}];

      self.income = parseInt($('#hh-income').data('slider-value'));
      self.members = parseInt($('#hh-members').data('slider-value'));
      self.mealOption = parseInt($("input[name='meal-option']:checked").val());

      self.percIncomeForFood = getPercIncomeForFood();

      self.foodCost = calcFoodCost();
      self.residualIncome = calcResidualIncome();
      self.typicalExpenditure = calcTypicalExpenditure();

      self.foodCostCoverage = calcFoodCostCoverage();
      self.otherCostCoverage = calcOtherCostCoverage();

      drawSummary();

      self.incomeSlider = $('#hh-income').slider({
        formatter: function(value) {
          return 'R' + value;
        },
        tooltip: 'always'
      });

      self.memberSlider = $('#hh-members').slider({
        formatter: function(value) {
          return value;
        },
        tooltip: 'always'
      });

      self.expenseSlider = $('#hh-expenses').slider({
        formatter: function(value) {
          return 'R ' + value;
        },
        value: self.residualIncome,
        max: round(self.typicalExpenditure, 0),
        tooltip: 'always'
      });


      self.updateIncome = function(e) {
        self.income = e.value;
        self.percIncomeForFood = getPercIncomeForFood();
        self.typicalExpenditure = calcTypicalExpenditure();
        updateCosts();

        drawSummary();
        drawExpenseSlider();
        meals.updateMealsADay();
      };

      self.updateMembers = function(e) {
        self.members = e.value;
        updateCosts();

        drawSummary();
        drawExpenseSlider();
        meals.updateMealsADay();
      };

      self.updateMealOption = function () {
        self.mealOption = parseInt($("input[name='meal-option']:checked").val());
        updateCosts();

        drawSummary();
        drawExpenseSlider();
        meals.updateMealsADay();
      };

      self.updateExpensePortion = function(e) {
        var adjustedFoodCostCoverage = (self.income - e.value) / self.foodCost;
        var adjustedOtherCostCoverage = e.value / self.typicalExpenditure;

        self.foodCostCoverage = (adjustedFoodCostCoverage > 1) ? 1 : adjustedFoodCostCoverage;
        self.otherCostCoverage = (adjustedOtherCostCoverage > 1) ? 1 : adjustedOtherCostCoverage;

        meals.updateMealsADay();
        drawSummary();
      };

      function numberInRange(num, min, max) {
        return num >= min && num <= max;
      }

      function getPercIncomeForFood() {
        var decile = _.find(incomeDecileRanges, function(d) {
          return numberInRange(self.income, d.range[0], d.range[1]);
        });
        return decile.percFood;
      }

      function calcFoodCost() {
        return foodCostPerPerson[self.mealOption] * self.members;
      }

      function calcFoodCostCoverage() {
        // Returns the ratio (0-1) to which income covers the cost of the food basket.
        var coverage = self.income / self.foodCost;
        return (coverage > 1) ? 1 : coverage;
      }

      function calcOtherCostCoverage() {
        // Returns the ratio (0-1) to which residual income covers other household costs.
        var coverage = self.residualIncome / self.typicalExpenditure;
        return (coverage > 1) ? 1 : coverage;
      }

      function calcResidualIncome() {
        var residual = self.income - self.foodCost;
        return (residual < 0) ? 0 : residual;
      }

      function calcTypicalExpenditure() {
        return self.income * (1 - self.percIncomeForFood);
      }

      function updateCosts () {
        self.foodCost = calcFoodCost();
        self.residualIncome = calcResidualIncome();
        self.foodCostCoverage = calcFoodCostCoverage();
        self.otherCostCoverage = calcOtherCostCoverage();
      }

      function drawSummary () {

        var mealsADayDesc = {
          0: "People in the household are getting three meals a day",
          1: "People in the household are not getting three meals a day"
        };

        var coverExpensesDesc = {
          0: "Household is covering other expenses",
          1: "Household is not covering other expenses"
        };

        $('#cover-meals').find('.description').text(self.foodCostCoverage === 1 ? mealsADayDesc[0] : mealsADayDesc[1]);
        $('#cover-expenses').find('.description').text(self.otherCostCoverage === 1 ? coverExpensesDesc[0] : coverExpensesDesc[1]);

        // Show the correct icon
        $('#cover-meals').find(self.foodCostCoverage === 1 ? '.safe' : '.warning').css('display', 'block');
        $('#cover-meals').find(self.foodCostCoverage === 1 ? '.warning' : '.safe').css('display', 'none');

        $('#cover-expenses').find(self.otherCostCoverage === 1 ? '.safe' : '.warning').css('display', 'block');
        $('#cover-expenses').find(self.otherCostCoverage === 1 ? '.warning' : '.safe').css('display', 'none');

        // Set class to determine background colour
        $('#cover-meals').removeClass('warning').addClass(self.foodCostCoverage < 1 ? "warning" : "");
        $('#cover-expenses').removeClass('warning').addClass(self.otherCostCoverage < 1 ? "warning" : "");

        $('#food-cost').find('.amount')
          .text("R " + round(self.foodCost, 0));

        $('#residual-income').find('.amount')
          .text("R " + round(self.residualIncome, 0));

        $('#typical-expenditure').find('.amount')
          .text("R " + (self.typicalExpenditure > 0 ? round(self.typicalExpenditure, 0) : 0));
      }

      function drawExpenseSlider () {
        self.expenseSlider
          .slider('setAttribute', 'value', self.residualIncome)
          .slider('setAttribute', 'max', self.typicalExpenditure)
          .slider('refresh')
          .slider('relayout');
      }

    }

    function Meals() {

      var self = this;
      var mealsADayMeasure = 3;
      var plateData = [];

      self.drawPlates = function () {

        var width, height;

        // Use window location to build image src
        var src = (window.location.origin + window.location.pathname).replace("index.html", "");
        var plateImage = src + "img/plate.svg";

        var gridLength = mealsADayMeasure;

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

        var platePattern = patternGrid.circleLayout()
          .config({
            image: plateImage,
            radius: circleSize.width,
            padding: [spacing.h, spacing.v],
            margin: [initialPosition.y, initialPosition.x],
            id: "plate"
        });

        var generateArc = function(fraction) {
          return path({endAngle: Math.PI * 2 * fraction});
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

      self.updateMealsADay = function() {
        plateData = compilePlateData();
        self.drawPlates();
      };

      self.updateMealsADay();

      function compilePlateData() {
        var mealsADay = household.foodCostCoverage * mealsADayMeasure;
        var platePortion = 0;
        var plateGrid = [];

        // Create data object
        for (var i=0; i < mealsADayMeasure; i++) {
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

    }

  });

})(jQuery);
