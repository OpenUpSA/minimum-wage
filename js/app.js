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
    var basket = new FoodBasket();

    $('#go-shop').on('click', function() {
      $('#shop').css('display', 'block');
      pymChild.sendHeight();
      var sticky = new Sticky('#summary');
    });

    $('.add').on('click', function () {
      var foodId = $(this).parents('.food-block')[0].id;
      basket.addToBasket(foodId);
    });

    $('.remove').on('click', function () {
      var foodId = $(this).parents('.food-block')[0].id;
      basket.removeFromBasket(foodId);
    });

    $('#hh-income').on('change', function() {
      household.updateIncome();
    });

    household.adultSlider.on('slideStop', household.updateAdults);
    household.childSlider.on('slideStop', household.updateChildren);

  function Household() {
    var self = this;

    var adultkCal = 2000;
    var childkCal = 1500;

    self.adultSlider = $('#hh-adults').slider({
      formatter: function(value) {
        return value;
      },
      tooltip: 'always'
    });

    self.childSlider = $('#hh-children').slider({
      formatter: function(value) {
        return value;
      },
      tooltip: 'always'
    });

    self.income = parseInt($("input[name='income']:checked").val());
    self.adults = parseInt($('#hh-adults').val());
    self.children = parseInt($('#hh-children').val());
    self.reqkCal = calcReqkCal();

    self.updateIncome = function () {
      self.income = parseInt($("input[name='income']:checked").val());
    };

    self.updateAdults = function(e) {
      self.adults = e.value;
      self.updateReqkCal();
    };

    self.updateChildren = function(e) {
      self.children = e.value;
      self.updateReqkCal();
    };

    self.updateReqkCal = function() {
      self.reqkCal = calcReqkCal();
    };

    function calcReqkCal() {
      return (self.adults * adultkCal) + (self.children * childkCal);
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
