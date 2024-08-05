document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.has-dropdown > a');

    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (window.innerWidth < 768) { // Adjust this breakpoint as needed
                e.preventDefault();
                this.parentNode.classList.toggle('active');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.has-dropdown')) {
            document.querySelectorAll('.has-dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
})