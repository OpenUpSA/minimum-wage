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

    fillInitialExpenses();
    updateView()

    function fillInitialExpenses() {
      for (var key in EXPENSE_DATA) {
        var perc = parseFloat(EXPENSE_DATA[key]);
        expenses[key] = {
          'perc': perc,
          'amount': perc * income
        }
      }
    }

    function drawExpenses() {
      $('#expense-blocks').children().each( function () {
        var key = $(this).attr('id');
        $(this).find('.amount').text(round(expenses[key]['amount']));
        $(this).find('.perc').text(round(expenses[key]['perc'] * 100, 2));
      });
    }

    function totalExpenses() {
      var total = 0;
      for(var key in expenses) {
        total += expenses[key]['amount'];
      }
      total_exp = total;
    }

    function fillBalance() {
      var balance = income - round(total_exp);
      $('#balance').find('.amount').text(balance);
      $('#balance').removeClass("negative positive").addClass(balance < 0 ? 'negative' : 'positive');
    }

    function updateExpenses(e) {
      var key = e['target'].dataset['sliderId'];
      expenses[key]['amount'] = e.value;
      expenses[key]['perc'] = e.value / income;
      updateView()
    }

    function updateView() {
      drawExpenses();
      totalExpenses();
      fillBalance();
    }

    function round(value, decimals) {
      // Decimals = 0 if not passed
      decimals = typeof decimals !== 'undefined' ? decimals : 0;
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    $('#hh-income').keyup(function() {
      income = $(this).val();
      totalExpenses();
      fillBalance();
    });

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

    var housingSlider = $('#housing-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['housing']['amount'],
    });

    housingSlider.on('slideStop', updateExpenses);

    var foodSlider = $('#food-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['food']['amount']
    });

    foodSlider.on('slideStop', updateExpenses);

    var transportSlider = $('#transport-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['transport']['amount']
    });

    transportSlider.on('slideStop', updateExpenses);

    var educationSlider = $('#education-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['education']['amount']
    });

    educationSlider.on('slideStop', updateExpenses);

    var healthSlider = $('#health-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['health']['amount']
    });

    healthSlider.on('slideStop', updateExpenses);

    var communicationSlider = $('#communication-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['communication']['amount']
    });

    communicationSlider.on('slideStop', updateExpenses);

    var discretionarySlider = $('#discretionary-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['discretionary']['amount']
    });

    discretionarySlider.on('slideStop', updateExpenses);

    var otherSlider = $('#other-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['other']['amount']
    });

    otherSlider.on('slideStop', updateExpenses);

  });
})(jQuery)
