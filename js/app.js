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


    function fill_initial_expenses() {
      for (var key in EXPENSE_DATA) {
        var perc = parseFloat(EXPENSE_DATA[key]);
        expenses[key] = {
          'perc': perc,
          'amount': perc * income
        }
      }
    }

    function draw_expenses() {
      $('#expense-blocks').children().each( function () {
        var key = $(this).attr('id');
        $(this).find('.amount').text(round(expenses[key]['amount']));
        $(this).find('.perc').text(round(expenses[key]['perc'] * 100, 2));
      });
    }

    function total_expenses() {
      var total = 0;
      for(var key in expenses) {
        total += expenses[key]['amount'];
      }
      total_exp = total;
    }

    function fill_balance() {
      var balance = income - round(total_exp);
      $('#balance').find('.amount').text(balance);
      $('#balance').removeClass("negative positive").addClass(balance < 0 ? 'negative' : 'positive');
    }

    function round(value, decimals) {
      // Default decimals to 0 is not passed
      decimals = typeof decimals !== 'undefined' ? decimals : 0;
      return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    }

    function update_expenses(e) {
      var key = e['target'].dataset['sliderId'];
      expenses[key]['amount'] = e.value;
      expenses[key]['perc'] = e.value / income;
      draw_expenses();
      total_expenses();
      fill_balance();
    }

    fill_initial_expenses();
    draw_expenses();
    total_expenses();
    fill_balance();

    $('#hh-income').keyup(function() {
      income = $(this).val();
      total_expenses();
      fill_balance();
    });

    var members_slider = $('#hh-members').slider({
        formatter: function(value) {
          return value;
        }
    });

    var children_slider = $('#hh-children').slider({
        formatter: function(value) {
          return value;
        }
    });

    var housing_slider = $('#housing-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['housing']['amount'],
    });

    housing_slider.on('slideStop', update_expenses);

    var food_slider = $('#food-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['food']['amount']
    });

    food_slider.on('slideStop', update_expenses);

    var transport_slider = $('#transport-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['transport']['amount']
    });

    transport_slider.on('slideStop', update_expenses);

    var education_slider = $('#education-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['education']['amount']
    });

    education_slider.on('slideStop', update_expenses);

    var health_slider = $('#health-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['health']['amount']
    });

    health_slider.on('slideStop', update_expenses);

    var communication_slider = $('#communication-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['communication']['amount']
    });

    communication_slider.on('slideStop', update_expenses);

    var discretionary_slider = $('#discretionary-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['discretionary']['amount']
    });

    discretionary_slider.on('slideStop', update_expenses);

    var other_slider = $('#other-slider').slider({
      formatter: function(value) {
        return value;
      },
      value: expenses['other']['amount']
    });

    other_slider.on('slideStop', update_expenses);



  });
})(jQuery)
