"use strict";

var pymChild = new pym.Child({
  id: "min-wage-embed-parent"
});

$(window).on('load', function() {
  pymChild.sendHeight();
});

(function($) {
  $(document).ready(function () {

    var hhAdultSlider = $('#hh-adults').slider({
      formatter: function(value) {
        return value;
      },
      tooltip: 'always'
    });

    var hhChildrenSlider = $('#hh-children').slider({
      formatter: function(value) {
        return value;
      },
      tooltip: 'always'
    });

    var basket = new FoodBasket();

    $('.add').on('click', function () {
      var foodId = $(this).parents('.food-block')[0].id;
      basket.addToBasket(foodId);
    });

    $('.remove').on('click', function () {
      var foodId = $(this).parents('.food-block')[0].id;
      basket.removeFromBasket(foodId);
    });

    $('#go-shop').on('click', function() {
      $('#shop').css('display', 'block');
      pymChild.sendHeight();
      var sticky = new Sticky('#balance');
    });

  });

  var Houshold = function () {
    var self = this;

    self.income = parseInt($('#hh-income').val());
    self.adults = parseInt($('#hh-adults').val());
    self.children = parseInt($('#hh-children').val());

  };

  var FoodBasket = function() {
    var self = this;

    self.cost = 0;
    self.kCal = 0;
    // self.balance = 0;
    self.foods = {};

    var round = function(value, decimals) {
      // Decimals = 0 if not passed
      decimals = typeof decimals !== 'undefined' ? decimals : 0;
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    self.addToBasket = function(id) {
      if (id in self.foods) {
        self.foods[id] += 1;
      } else {
        self.foods[id] = 1;
      }
      calcTotals();
      draw(id);
    }

    self.removeFromBasket = function(id) {
      if (id in self.foods) {
        self.foods[id] -= 1;
        if (self.foods[id] === 0) {
          delete self.foods[id];
        }
      }
      calcTotals();
      draw(id);
    }

    function calcTotals() {
      totalCost();
      totalkCal();
    }

    function draw(id) {
      drawFoodQty(id);
      drawTotalCost();
      drawTotalkCal();
    }

    function totalCost() {
      var total = 0;
      _.each(self.foods, function(qty, id) {
        var price = FOOD_DATA[id]['price100g'] * (FOOD_DATA[id]['weight'] / 100) * qty;
        total += price;
      });
      self.cost = total;
    }

     function totalkCal() {
      var total = 0;
      _.each(self.foods, function(qty, id) {
        var kCal = FOOD_DATA[id]['kCal100g'] * (FOOD_DATA[id]['weight'] / 100) * qty;
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

  };

})(jQuery);
