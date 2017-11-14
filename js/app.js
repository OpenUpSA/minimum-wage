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

        self.foodCostCoverage = calcFoodCostCoverage();
        self.otherCostCoverage = calcOtherCostCoverage();

        drawResults();
        meals.updateMealsADay();
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
          .text("R " + (self.otherExpensesCost > 0 ? self.otherExpensesCost : 0));

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

  });

})(jQuery);
