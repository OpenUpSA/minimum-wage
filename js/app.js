var pymChild = new pym.Child({
  id: "min-wage-embed-parent"
});

$(window).on('load', function() {
  pymChild.sendHeight();
});

(function($) {
  $(document).ready(function () {

    var hh_income = parseInt($('#hh-income').val()),
        hh_members = parseInt($('#hh-members').val()),
        hh_children = parseInt($('#hh-children').val()),
        balance = 0,
        total_exp = 0,
        exp_obj = {};


    function fill_exp_obj () {
      $('#expense-categories').children().each( function () {
        var key = $(this).attr('id'),
            perc = parseFloat($(this).find('.perc').text());
        exp_obj[key] = {
          'perc': perc,
          'amount': perc * hh_income
        }
      });
    }

    function fill_initial_epxense_amounts() {
      $('#expense-categories').children().each( function () {
        var key = $(this).attr('id');
        $(this).find('.amount').text(round(exp_obj[key]['amount']));
      });
    }

    function calc_total_expense() {
      var total = 0;
      for(var key in exp_obj) {
        total += exp_obj[key]['amount'];
      }
      total_exp = total;
    }

    function fill_balance() {
      var balance = hh_income - total_exp;
      $('#balance').find('.amount').text(round(balance));
      $('#balance').removeClass("negative positive").addClass(balance < 0 ? 'negative' : 'positive');
    }

    function round(n) {
      return Math.round(n);
    }

    fill_exp_obj()
    fill_initial_epxense_amounts();
    calc_total_expense()
    fill_balance()

    $('#hh-income').keyup(function() {
      hh_income = $(this).val();
      calc_total_expense();
      fill_balance();
    });


  });
})(jQuery)
