"use strict";

var pymChild = new pym.Child({
  id: "min-wage-embed-parent"
});

$(window).on('load', function() {
  pymChild.sendHeight();
});

(function($) {
  $(document).ready(function () {

    var income = parseInt($('#hh-income').val());
    var members = parseInt($('#hh-members').val());
    var children = parseInt($('#hh-children').val());

    var total_exp = 0;
    var balance = 0;
    var expenses = {};

    var surplusText = "You have extra money available";
    var deficitText = "You're spending more than you have";
    var balancedText = "Your expenses match your income";

    fillInitialExpenses();
    updateView();

    function fillInitialExpenses() {
      _.each(EXPENSE_DATA, function(value, key) {
        var perc = parseFloat(value);
        expenses[key] = {
          perc: perc,
          amount: perc * income
        };
      });
    }

    function updateView() {
      drawExpenses();
      totalExpenses();
      fillBalance();
      drawSliders();
    }

    function drawExpenses() {
      $('#expenses').children().each( function () {
        var key = $(this).attr('id');
        $(this).find('.amount').text("R " + round(expenses[key].amount));
        $(this).find('.perc').text(round(expenses[key].amount / income * 100, 2) + " %");
        $(this).find('.of-total').text("of R " + income);
      });
    }

    function totalExpenses() {
      var total = 0;
      _.each(expenses, function(expense) {
        total += expense.amount;
      });
      total_exp = total;
    }

    function fillBalance() {
      balance = income - round(total_exp);
      $('#balance').find('.amount').text(balance === 0 ? "" : "R " + balance);
      $('#balance').find('.name').text(balance === 0 ? balancedText : (balance < 0 ? deficitText : surplusText));
      $('#balance').removeClass("negative positive").addClass(balance < 0 ? 'negative' : 'positive');
    }

    function updateExpenses(e) {
      var key = e.target.dataset.sliderId;
      expenses[key].amount = e.value;
      expenses[key].perc = e.value / income;
      updateView();
    }

    function round(value, decimals) {
      // Decimals = 0 if not passed
      decimals = typeof decimals !== 'undefined' ? decimals : 0;
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    $('#hh-income').keyup(function() {
      income = $(this).val();
      updateView();
    });

    function drawSliders() {
      var expenseSliderNameIDs = {
        housing: '#housing-slider',
        food: '#food-slider',
        transport: '#transport-slider',
        education: '#education-slider',
        health: '#health-slider',
        communication: '#communication-slider',
        discretionary: '#discretionary-slider',
        other: '#other-slider'
      };

      var expenseSliders = {};

      _.each(expenseSliderNameIDs, function(id, key) {
        expenseSliders[key] = $(id).slider({
          formatter: function(value) {
            return value;
          },
          value: expenses[key].amount,
          min: 0,
          max: income,
          step: income < 1000 ? 5 : round(income * 0.0015)
        });

        expenseSliders[key].on('slideStop', updateExpenses);
      });
    }

    var hhSliderNameIDs = {
      members: '#hh-members',
      children: '#hh-children'
    };

    var membersSlider = $('#hh-members').slider({
      formatter: function(value) {
        return value;
      }
    });

    var childrenSlider = $('#hh-children').slider({
      formatter: function(value) {
        return value;
      }
    });

    $('#show-money').on('click', function() {
      $('#money').css('display', 'block');
      var sticky = new Sticky('#balance');
    });


  });

})(jQuery)
