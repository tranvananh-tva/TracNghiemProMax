// Mobile Menu Handler
// Xử lý menu hamburger và sidebar trên mobile

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initMobileMenu();
    });
    
    function initMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const navItems = document.querySelectorAll('.nav-item');
        
        if (!mobileMenuToggle || !sidebar || !sidebarOverlay) {
            console.warn('Mobile menu elements not found');
            return;
        }
        
        // Toggle sidebar on mobile menu button click
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleSidebar();
        });
        
        // Close sidebar when clicking overlay
        sidebarOverlay.addEventListener('click', function() {
            closeSidebar();
        });
        
        // Close sidebar when clicking nav items on mobile
        navItems.forEach(function(item) {
            item.addEventListener('click', function() {
                // Only close on mobile/tablet
                if (window.innerWidth < 1024) {
                    closeSidebar();
                }
            });
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                // Close sidebar if resizing to desktop
                if (window.innerWidth >= 1024) {
                    closeSidebar();
                }
            }, 250);
        });
        
        // Prevent body scroll when sidebar is open on mobile
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    const isOpen = sidebar.classList.contains('open');
                    if (isOpen && window.innerWidth < 1024) {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                }
            });
        });
        
        observer.observe(sidebar, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });
        
        // Swipe to close on mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        sidebar.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        sidebar.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeDistance = touchEndX - touchStartX;
            // Swipe left to close (at least 50px)
            if (swipeDistance < -50 && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        }
        
        console.log('✅ Mobile menu initialized');
    }
    
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }
    
    function openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.add('open');
        overlay.classList.add('active');
        
        // Animate menu icon
        const menuIcon = document.querySelector('#mobile-menu-toggle i');
        if (menuIcon) {
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-times');
        }
    }
    
    function closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        
        // Animate menu icon
        const menuIcon = document.querySelector('#mobile-menu-toggle i');
        if (menuIcon) {
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        }
    }
    
    // Export functions for external use
    window.MobileMenu = {
        open: openSidebar,
        close: closeSidebar,
        toggle: toggleSidebar
    };
    
})();
