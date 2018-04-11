$(document).ready(function() {
    function hover(element) {
        element.setAttribute('src', '../public/img/everest.png').fadeIn();
    }

    function unhover(element) {
        element.setAttribute('src', '../public/img/everest_minimal.svg').fadeIn();
    }
});