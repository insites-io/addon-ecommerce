 // Add a scroll event listener to the window to close the mega menu
 window.addEventListener('scroll', function() {
    const megaMenu = document.getElementById('mega-menu');
    if (megaMenu) {
      megaMenu.close();  
    }
});