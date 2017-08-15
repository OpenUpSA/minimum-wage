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
        pocket = 0,
        exp_obj = {};


    function populate_exp_obj () {
      $('#expense-categories').children().each( function () {
        var key = $(this).attr('id'),
            perc = parseFloat($(this).find('.perc').text());
        exp_obj[key] = {
          'perc': perc,
          'amount': perc * hh_income
        }
      });
    }

    function fill_initial_amounts() {
      $('#expense-categories').children().each( function () {
        var key = $(this).attr('id');
        $(this).find('.amount').text(exp_obj[key]['amount']);
      });
    }

    populate_exp_obj()
    fill_initial_amounts();


  });
})(jQuery)
