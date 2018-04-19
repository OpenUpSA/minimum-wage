"use strict";

var pymChild = new pym.Child({
  id: "min-wage-embed-parent"
});

$(window).on('load', function() {
  pymChild.sendHeight();
});

(function($) {

  $(document).ready(function () {

    $(window).on('resize', function() {
      // Redraw plates on resize
      meals.drawPlates();
      pymChild.sendHeight();
    });

    function round(value, decimals) {
      // decimals = 0 if not passed
      decimals = typeof decimals !== 'undefined' ? decimals : 0;
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    function numberWithSpaces(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    var household = new Household();
    var meals = new Meals();

    household.incomeSlider.on('slideStop', household.updateIncome);
    household.memberSlider.on('slideStop', household.updateMembers);
    household.expenseSlider.on('slideStop', household.updateExpensePortion);

    $('#meal-options').on('change', household.updateMealOption);

    // Extra info boxes
    $('.intro-info').on('click', function(e) {
      $('#intro-info').slideToggle();
      pymChild.sendHeight();
    });

    $('.results-info').on('click', function(e) {
      $('#results-info').find('#' + e.currentTarget.id).slideToggle();
      $('#results-info').find('#' + e.currentTarget.id).siblings().slideUp();
      pymChild.sendHeight();
    });

    $('.meal-options-info').on('click', function(e) {
      $('#meal-options-info').find('#' + e.currentTarget.id).slideToggle();
      $('#meal-options-info').find('#' + e.currentTarget.id).siblings().slideUp();
      pymChild.sendHeight();
    });

    // Reset to defaults
    $('#reset').on('click', function(e) {
      household.resetValues();
    });

    function Household() {
      var self = this;

      /* Cost of food per person per month:
         1: Stats SA Food poverty line
         2. PACSA minimum nutritional basket (10 500 kJ a day - Feb 2018) */

      var foodCostPerPerson = {
        '1': 531,
        '2': 615.58};

      /* Percentage spent on food accoring to Stats SA’s
         Income and Expenditure of Households Survey, 2012 */

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

      init();

      $('#pacsa-min-cost').text(numberWithSpaces(foodCostPerPerson[2]));

      self.updateIncome = function(e) {
        self.income = e.value;
        self.percIncomeForFood = getPercIncomeForFood();
        calcCosts();
        drawResults();
        meals.updateMealsADay();
      };

      self.updateMembers = function(e) {
        self.members = e.value;
        calcCosts();
        drawResults();
        meals.updateMealsADay();
      };

      self.updateMealOption = function () {
        self.mealOption = parseInt($("input[name='meal-option']:checked").val());
        calcCosts();
        drawResults();
        meals.updateMealsADay();
      };

      self.updateExpensePortion = function(e) {
        self.incomeForFood = self.income - e.value;
        self.incomeForOtherExpenses = e.value;

        self.foodCostCoverage = calcFoodCostCoverage();
        self.otherCostCoverage = calcOtherCostCoverage();

        drawResults();
        meals.updateMealsADay();
      };

      self.resetValues = function() {
        setDefaultValues();
        resetInputControls();
        drawResults();
        meals.updateMealsADay();
      };

      function init() {
        setDefaultValues();
        initSliders();
        drawResults();
      };

      function setDefaultValues() {
        self.income = 3200;
        self.members = 4;
        self.mealOption = 1;
        self.percIncomeForFood = getPercIncomeForFood();
        calcCosts();
      }

      function initSliders() {
        self.incomeSlider = $('#hh-income').slider({
          value: self.income,
          formatter: function(value) {
            return 'R' + numberWithSpaces(value);
          },
          tooltip: 'always'
        });

        self.memberSlider = $('#hh-members').slider({
          value: self.members,
          formatter: function(value) {
            return value;
          },
          tooltip: 'always'
        });

        self.expenseSlider = $('#hh-expenses').slider({
          value: self.incomeForOtherExpenses,
          formatter: function(value) {
            return 'R' + numberWithSpaces(value);
          },
          max: round(self.otherExpensesCost, 0),
          tooltip: 'always',
          precision: 0
        });

      }

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

      function calcIncomeForFood() {
        return round(self.income * self.percIncomeForFood, 0)
      }

      function calcOtherExpensesCost() {
        return round(self.income * (1 - self.percIncomeForFood), 0);
      }

      function calcIncomeForOtherExpenses() {
        return self.income - self.incomeForFood;
      }

      function calcFoodCostCoverage() {
        // Returns the ratio (0-1) to which income available for food,
        // covers the cost of food.
        var coverage = self.incomeForFood / self.foodCost;
        return (coverage > 1) ? 1 : coverage;
      }

      function calcOtherCostCoverage() {
        // Returns the ratio (0-1) to which the income available for other expenses
        // covers the cost of other expenses.
        var coverage = self.incomeForOtherExpenses / self.otherExpensesCost;
        return (coverage > 1) ? 1 : coverage;
      }

      function calcCosts() {
        self.foodCost = calcFoodCost();
        self.incomeForFood = calcIncomeForFood();

        self.otherExpensesCost = calcOtherExpensesCost();
        self.incomeForOtherExpenses = calcIncomeForOtherExpenses();

        self.foodCostCoverage = calcFoodCostCoverage();
        self.otherCostCoverage = calcOtherCostCoverage();
      }

      function drawResults() {
        var verdictTag = {
          0: "Your household can buy enough food on that wage.",
          1: "Your household can't buy enough food on that wage."
        };

        var mealsADayTag = {
          0: "People in the household are receiving three meals a day",
          1: "People in the household are not receiving three meals a day"
        };

        var coverExpensesTag = {
          0: "Other household expenses are being covered",
          1: "Other household expenses are not being covered"
        };

        $('#cover-meals').find('.tag').text(self.foodCostCoverage === 1 ? mealsADayTag[0] : mealsADayTag[1]);
        $('#cover-expenses').find('.tag').text(self.otherCostCoverage === 1 ? coverExpensesTag[0] : coverExpensesTag[1]);

        // Display correct verdict line
        $('#verdict').text(self.foodCostCoverage === 1 ? verdictTag[0] : verdictTag[1]);

        // Show the correct icons
        $('#cover-meals').find(self.foodCostCoverage === 1 ? '.safe' : '.warning').css('display', 'block');
        $('#cover-meals').find(self.foodCostCoverage === 1 ? '.warning' : '.safe').css('display', 'none');

        $('#cover-expenses').find(self.otherCostCoverage === 1 ? '.safe' : '.warning').css('display', 'block');
        $('#cover-expenses').find(self.otherCostCoverage === 1 ? '.warning' : '.safe').css('display', 'none');

        $('#other-expenses').find('.end')
          .text("R" + (self.otherExpensesCost > 0 ? numberWithSpaces(self.otherExpensesCost) : 0));

        self.expenseSlider
          .slider('setAttribute', 'value', self.incomeForOtherExpenses)
          .slider('setAttribute', 'max', self.otherExpensesCost)
          .slider('refresh')
          .slider('relayout');
      }

      function resetInputControls() {
        self.incomeSlider
          .slider('setAttribute', 'value', self.income)
          .slider('refresh')
          .slider('relayout');

        self.memberSlider
          .slider('setAttribute', 'value', self.members)
          .slider('refresh')
          .slider('relayout');

        $('input[name="meal-option"]').filter('[value="1"]').click();
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
        var plateImage = src + "img/food-plate.png";

        var gridLength = mealsADayMeasure;

        var svg1 = d3.select("svg").remove();
        var svg = d3.select("#plates").append("svg");

        var defs = svg.append("defs");

        function updateDimensions(containerWidth) {
          //get dimensions based on width of container element
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
