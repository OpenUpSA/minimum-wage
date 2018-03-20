"use strict";

var pymChild = new pym.Child({
  id: "min-wage-embed-parent"
});

$(window).on('load', function() {
  pymChild.sendHeight();
});

(function($) {

  $(document).ready(function () {

    function round(value, decimals) {
      // decimals = 0 if not passed
      decimals = typeof decimals !== 'undefined' ? decimals : 0;
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    var household = new Household();

    household.incomeSlider.on('slideStop', household.updateIncome);
    household.memberSlider.on('slideStop', household.updateMembers);
    household.foodExpenseSlider.on('slideStop', household.updateFoodExpensePortion);
    household.expenseSlider.on('slideStop', household.updateExpensePortion);

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
         2. PACSA minimum nutritional basket (10 500 kJ a day - June 2017) */

      var foodCostPerPerson = {
        '1': 531,
        '2': 621.35};

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

      self.updateIncome = function(e) {
        self.income = e.value;
        self.percIncomeForFood = getPercIncomeForFood();
        calcCosts();
        drawResults();
      };

      self.updateMembers = function(e) {
        self.members = e.value;
        calcCosts();
        drawResults();
      };

      self.updateMealOption = function () {
        self.mealOption = parseInt($("input[name='meal-option']:checked").val());
        calcCosts();
        drawResults();
      };

      self.updateExpensePortion = function(e) {
        self.incomeForFood = self.income - e.value;
        self.incomeForOtherExpenses = e.value;

        self.otherCostCoverage = calcOtherCostCoverage();

        setNutritionLevel();
        drawResults();
      };

      self.updateFoodExpensePortion = function(e) {
        self.incomeForFood = e.value;
        self.incomeForOtherExpenses = self.income - e.value;

        self.otherCostCoverage = calcOtherCostCoverage();

        setNutritionLevel();
        drawResults();
      };

      self.resetValues = function() {
        setDefaultValues();
        resetInputControls();
        drawResults();
      };

      function init() {
        setDefaultValues();
        initSliders();
        drawResults();
      }

      function setDefaultValues() {
        self.income = 3200;
        self.members = 4;
        self.percIncomeForFood = getPercIncomeForFood();
        calcCosts();
      }

      function initSliders() {
        self.incomeSlider = $('#hh-income').slider({
          value: self.income,
          formatter: function(value) {
            return 'R' + value;
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

        self.foodExpenseSlider = $('#food-expense').slider({
          value: self.incomeForFood,
          formatter: function(value) {
            return 'R ' + value;
          },
          // max: self.nutritionLevel2,
          tooltip: 'always',
          precision: 0
        });

        self.expenseSlider = $('#hh-expenses').slider({
          value: self.incomeForOtherExpenses,
          formatter: function(value) {
            return 'R ' + value;
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

      function calcIncomeForFood() {
        return round(self.income * self.percIncomeForFood, 0);
      }

      function calcOtherExpensesCost() {
        // TODO: This boils down to the same calc as calcIncomeForOtherExpenses
        return round(self.income * (1 - self.percIncomeForFood), 0);
      }

      function calcIncomeForOtherExpenses() {
        // DO THIS: return self.otherExpensesCost;
        return self.income - self.incomeForFood;
      }

      function calcOtherCostCoverage() {
        // Returns the ratio (0-1) to which the income available for other expenses
        // covers the cost of other expenses.
        var coverage = self.incomeForOtherExpenses / self.otherExpensesCost;
        return (coverage > 1) ? 1 : coverage;
      }

      function calcNutritionLevelCost (i) {
        return round(self.members * foodCostPerPerson[i], 2);
      }

      function calcHouseholdNutritionLevel () {
        if (self.incomeForFood < self.nutritionLevel1) {
          return 0;
        }
        else if (self.incomeForFood < self.nutritionLevel2) {
          return 1;
        }
        else {
          return 2;
        }
      }

      function setNutritionLevel() {
        self.hhNutritionLevel = calcHouseholdNutritionLevel();
      }


      function calcCosts() {
        self.incomeForFood = calcIncomeForFood();

        self.otherExpensesCost = calcOtherExpensesCost();
        self.incomeForOtherExpenses = calcIncomeForOtherExpenses();

        self.otherCostCoverage = calcOtherCostCoverage();

        self.nutritionLevel1 = calcNutritionLevelCost(1);
        self.nutritionLevel2 = calcNutritionLevelCost(2);

        setNutritionLevel();
      }



      function drawResults() {
        var verdictTag = {
          0: "Your household's minimum energy requirements is not being met.",
          1: "Your household is receiving a diet that is nutritionally incomplete.",
          2: "Your household is receiving diet complete in minimum nutrition."
        };

        var coverExpensesTag = {
          0: "Other household expenses are being covered",
          1: "Other household expenses are not being covered"
        };

        var verdictIconClass = {
          0: "poor",
          1: "incomplete",
          2: "good"
        };

        // $('#cover-meals').find('.tag').text(self.foodCostCoverage === 1 ? mealsADayTag[0] : mealsADayTag[1]);
        $('#cover-expenses').find('.tag').text(self.otherCostCoverage === 1 ? coverExpensesTag[0] : coverExpensesTag[1]);

        // Display correct verdict line
        $('#verdict').text(verdictTag[self.hhNutritionLevel]);
        $('#income-for-food').find('.amount').text('R ' + self.incomeForFood);

        $('#verdict-icons').find('.active').removeClass('active');
        $('#verdict-icons').find('.diet-level.' + verdictIconClass[self.hhNutritionLevel]).addClass('active');

        $('#verdict-icons').find('.diet-level-1.amount').text('R ' + self.nutritionLevel1);
        $('#verdict-icons').find('.diet-level-2.amount').text('R ' + self.nutritionLevel2);


        $('#cover-expenses').find(self.otherCostCoverage === 1 ? '.safe' : '.warning').css('display', 'block');
        $('#cover-expenses').find(self.otherCostCoverage === 1 ? '.warning' : '.safe').css('display', 'none');

        $('#other-expenses').find('.end')
          .text("R " + (self.otherExpensesCost > 0 ? self.otherExpensesCost : 0));

        self.foodExpenseSlider
          .slider('setAttribute', 'value', self.incomeForFood)
          .slider('setAttribute', 'max', self.nutritionLevel2)
          .slider('refresh');

        // $('#food-expense').siblings('.end').text('R ' + self.income);

        $('#food-expense').siblings('.diet-level-1.axis').text('R ' + self.nutritionLevel1);
        $('#food-expense').siblings('.diet-level-1').css('left', (self.nutritionLevel1 / self.nutritionLevel2 * 100) + '%');

        $('#food-expense').siblings('.diet-level-2.axis').text('R ' + self.nutritionLevel2);
        $('#food-expense').siblings('.diet-level-2').css('left', (self.nutritionLevel2 / self.nutritionLevel2 * 100) + '%');




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

        // $('input[name="meal-option"]').filter('[value="1"]').click();
      }

    }

  });

})(jQuery);
