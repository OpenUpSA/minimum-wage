if (document.location.hostname == "localhost") {
    var baseurl = "";
} else {
    var baseurl = "https://openup.org.za/minimum-wage";
}
document.write('<div id="min-wage-embed-parent"></div>');
document.write('<script type="text/javascript" src="' + baseurl + '/bower_components/pym.js/dist/pym.v1.min.js" crossorigin="anonymous"></script>');

document.write("<script>var pymParent = new pym.Parent('min-wage-embed-parent', '" + baseurl + "index.html', {});</script>");
