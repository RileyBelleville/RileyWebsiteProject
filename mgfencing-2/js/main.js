/*
  Main JavaScript bundle for M&G Fencing site.

  This script consolidates behavior that was previously duplicated
  across multiple pages into a single location. Functionality includes:
   • Page fade transitions on navigation between internal pages
   • Mobile navigation menu toggling
   • IntersectionObserver to reveal sections on scroll
   • Automatically setting the current year in footers

  All code executes once the DOM is ready.
*/

document.addEventListener('DOMContentLoaded', () => {
  // Fade the page in on initial load
  document.body.classList.add('fade-in');

  // Observe sections with the .fade-section class and reveal them when they
  // enter the viewport. This avoids duplicating IntersectionObserver code on
  // every page and ensures consistent fade-in animations.
  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.fade-section').forEach(section => {
    sectionObserver.observe(section);
  });

  // Handle internal navigation links: fade out before navigating to the
  // destination. This prevents abrupt content changes and gives a more
  // polished feel to the site. Only links that share the same origin are
  // intercepted (external links are left untouched).
  document.querySelectorAll('a[href]').forEach(link => {
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin) {
      link.addEventListener('click', event => {
        // Skip anchor links pointing to in-page targets (#) to retain
        // default smooth scrolling behavior
        if (link.hash && link.pathname === location.pathname) {
          return;
        }
        event.preventDefault();
        const target = link.getAttribute('href');
        // Start fade-out
        document.body.classList.remove('fade-in');
        document.body.classList.add('fade-out');
        setTimeout(() => {
          location.href = target;
        }, 400);
      });
    }
  });

  // When navigating back/forward with the browser's history cache, ensure
  // the body resets to a visible state. Without this, pages restored from
  // bfcache would remain faded out.
  window.addEventListener('pageshow', evt => {
    if (evt.persisted) {
      document.body.classList.remove('fade-out');
      document.body.classList.add('fade-in');
    }
  });

  // Mobile navigation toggle: attaches a click listener to the nav button
  // (identified by [data-nav-toggle]) and toggles the visibility of the
  // associated menu (identified by [data-mobile-menu]). This avoids
  // hardcoding element IDs in multiple places.
  const navToggle = document.querySelector('[data-nav-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Insert the current year into any element with the data-year attribute.
  // This keeps the copyright year up to date without PHP or inline JS on
  // every page.
  const yearEls = document.querySelectorAll('[data-year]');
  const currentYear = new Date().getFullYear();
  yearEls.forEach(el => {
    el.textContent = currentYear;
  });
});