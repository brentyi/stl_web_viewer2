// Helpers for getting scroll position
// Based on:
//     https://stackoverflow.com/questions/2717252/document-body-scrolltop-is-always-0-in-ie-even-when-scrolling
var ScrollHelpers = {
  top: function () {
    return typeof window.pageYOffset != "undefined"
      ? window.pageYOffset
      : document.documentElement.scrollTop
      ? document.documentElement.scrollTop
      : document.body.scrollTop
      ? document.body.scrollTop
      : 0;
  },
  left: function () {
    return typeof window.pageXOffset != "undefined"
      ? window.pageXOffset
      : document.documentElement.scrollLeft
      ? document.documentElement.scrollLeft
      : document.body.scrollLeft
      ? document.body.scrollLeft
      : 0;
  },
};
