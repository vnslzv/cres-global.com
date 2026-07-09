const CRESCONFIG = {
  appStoreUrl: null,
  comingSoon: false,
};

const STORE_LABELS = {
  appstore: 'Download on the App Store',
};

function getStoreHref(platform) {
  if (platform === 'appstore' && CRESCONFIG.appStoreUrl) {
    return CRESCONFIG.appStoreUrl;
  }
  return '#cta';
}

function getStoreAriaLabel(platform) {
  return STORE_LABELS[platform] || 'Download Cres';
}

function initConversionLinks() {
  document.querySelectorAll('[data-store]').forEach((link) => {
    const platform = link.dataset.store;
    link.href = getStoreHref(platform);
    link.setAttribute('aria-label', getStoreAriaLabel(platform));
  });
}

function initImageFallbacks() {
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    const container = img.closest('.value-shot, .tile-screenshot, .phone-screen');
    const fallbackSrc = img.dataset.fallback;

    const markMissing = () => {
      if (container) {
        container.classList.add('is-missing');
      }
    };

    const tryFallback = () => {
      if (fallbackSrc && img.src !== new URL(fallbackSrc, window.location.href).href) {
        img.src = fallbackSrc;
        return;
      }
      markMissing();
    };

    img.addEventListener('error', tryFallback);

    if (img.complete && img.naturalWidth === 0) {
      tryFallback();
    }
  });

  document.querySelectorAll('.value-shot-img:not([data-fallback])').forEach((img) => {
    const container = img.closest('.value-shot');
    const markMissing = () => container?.classList.add('is-missing');

    img.addEventListener('error', markMissing);
    if (img.complete && img.naturalWidth === 0) {
      markMissing();
    }
  });
}

function initMobileNav() {
  const toggle = document.querySelector('.menu-toggle');
  const panel = document.querySelector('#mobile-nav');
  const backdrop = document.querySelector('.mobile-nav-backdrop');
  const desktopQuery = window.matchMedia('(min-width: 48rem)');

  if (!toggle || !panel) return;

  const isMenuOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    backdrop?.classList.remove('is-open');
    backdrop?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
  };

  const openMenu = () => {
    if (desktopQuery.matches) return;

    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    backdrop?.classList.add('is-open');
    backdrop?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nav-open');
  };

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (isMenuOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  backdrop?.addEventListener('click', closeMenu);

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
      closeMenu();
    }
  });

  const syncMenuToViewport = () => {
    if (desktopQuery.matches && isMenuOpen()) {
      closeMenu();
    }
  };

  desktopQuery.addEventListener('change', syncMenuToViewport);
  window.addEventListener('resize', syncMenuToViewport);

  closeMenu();
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;

      const target = document.querySelector(id);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', id);
    });
  });
}

const revealItems = [...document.querySelectorAll('.reveal')];
const featuresSection = document.querySelector('#features');
const audienceSection = document.querySelector('#audience');
const valueSection = document.querySelector('#value');

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function updateAudienceProgress() {
  if (!audienceSection) return;

  const rect = audienceSection.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const spreadStart = viewportHeight * 0.95;
  const spreadEnd = viewportHeight * 0.12;
  const progress = clamp((spreadStart - rect.top) / (spreadStart - spreadEnd), 0, 1);

  audienceSection.style.setProperty('--audience-progress', progress.toFixed(4));
}

function updateFeatureProgress() {
  if (!featuresSection) return;

  const rect = featuresSection.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const spreadStart = viewportHeight * 0.86;
  const spreadEnd = viewportHeight * 0.36;
  const progress = clamp((spreadStart - rect.top) / (spreadStart - spreadEnd), 0, 1);

  featuresSection.style.setProperty('--feature-progress', progress.toFixed(4));
}

function updateValueProgress() {
  if (!valueSection) return;

  const rect = valueSection.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const spreadStart = viewportHeight * 0.82;
  const spreadEnd = viewportHeight * 0.34;
  const progress = clamp((spreadStart - rect.top) / (spreadStart - spreadEnd), 0, 1);

  valueSection.style.setProperty('--value-progress', progress.toFixed(4));
}

let progressFrame = 0;

function scheduleScrollDrivenUpdates() {
  if (progressFrame) return;

  progressFrame = window.requestAnimationFrame(() => {
    progressFrame = 0;
    updateFeatureProgress();
    updateAudienceProgress();
    updateValueProgress();
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -5% 0px',
    },
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 80, 280)}ms`;
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

updateFeatureProgress();
updateAudienceProgress();
updateValueProgress();
window.addEventListener('scroll', scheduleScrollDrivenUpdates, { passive: true });
window.addEventListener('resize', scheduleScrollDrivenUpdates);

const heroVisual = document.querySelector('.hero-visual');
const heroAura = document.querySelector('.hero-aura');
const heroPhones = document.querySelector('.hero-phones');

let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
  if (!heroVisual) return;

  const rect = heroVisual.getBoundingClientRect();
  if (rect.top > window.innerHeight || rect.bottom < 0) return;

  mouseX = (e.clientX - rect.left) / rect.width;
  mouseY = (e.clientY - rect.top) / rect.height;
});

function animateHeroParallax() {
  if (!heroAura || !heroPhones) return;

  const offsetX = (mouseX - 0.5) * 12;
  const offsetY = (mouseY - 0.5) * 12;

  heroAura.style.transform = `translate(${offsetX * 0.3}px, ${offsetY * 0.3}px) scale(1.02)`;
  heroPhones.style.filter = `drop-shadow(${offsetX * 0.5}px ${offsetY * 0.5}px 20px rgba(91, 167, 247, 0.18))`;
}

window.addEventListener(
  'mousemove',
  () => {
    requestAnimationFrame(animateHeroParallax);
  },
  { passive: true },
);

function initStoryCarousel() {
  const carousel = document.querySelector('.story-carousel');
  const dotsContainer = document.querySelector('.story-carousel-dots');
  if (!carousel || !dotsContainer) return;

  const originalSlides = [...carousel.querySelectorAll('.story-slide')];
  const slideCount = originalSlides.length;
  if (slideCount === 0) return;

  if (slideCount > 1) {
    const firstClone = originalSlides[0].cloneNode(true);
    const lastClone = originalSlides[slideCount - 1].cloneNode(true);
    firstClone.classList.add('story-slide--clone');
    lastClone.classList.add('story-slide--clone');
    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');
    carousel.insertBefore(lastClone, originalSlides[0]);
    carousel.appendChild(firstClone);
  }

  const getSlides = () => [...carousel.querySelectorAll('.story-slide')];

  dotsContainer.innerHTML = '';
  const dots = originalSlides.map((slide, index) => {
    const label = slide.querySelector('.story-slide-label')?.textContent?.trim() || `Slide ${index + 1}`;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'story-carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', label);
    dot.setAttribute('aria-selected', 'false');
    dot.dataset.index = String(index);
    dotsContainer.appendChild(dot);
    return dot;
  });

  let isDragging = false;
  let isJumping = false;
  let startX = 0;
  let scrollLeft = 0;
  let scrollRaf = 0;
  let scrollEndTimer = 0;

  const getPhysicalIndex = (logicalIndex) => logicalIndex + 1;

  const getLogicalIndex = (physicalIndex, totalSlides) => {
    if (slideCount === 1) return 0;
    if (physicalIndex === 0) return slideCount - 1;
    if (physicalIndex === totalSlides - 1) return 0;
    return physicalIndex - 1;
  };

  const getClosestPhysicalIndex = () => {
    const slides = getSlides();
    const center = carousel.scrollLeft + carousel.clientWidth * 0.5;
    let activePhysical = 0;
    let minDistance = Infinity;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth * 0.5;
      const distance = Math.abs(center - slideCenter);
      if (distance < minDistance) {
        minDistance = distance;
        activePhysical = index;
      }
    });

    return activePhysical;
  };

  const scrollToPhysical = (physicalIndex, smooth = true) => {
    const slides = getSlides();
    const slide = slides[physicalIndex];
    if (!slide) return;

    isJumping = !smooth;
    if (!smooth) {
      carousel.classList.add('is-jumping');
    }

    slide.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      inline: 'center',
      block: 'nearest',
    });

    if (!smooth) {
      window.requestAnimationFrame(() => {
        carousel.classList.remove('is-jumping');
        isJumping = false;
      });
    } else {
      window.setTimeout(() => {
        isJumping = false;
      }, 420);
    }
  };

  const updateActiveSlide = () => {
    const slides = getSlides();
    const activePhysical = getClosestPhysicalIndex();
    const logicalIndex = getLogicalIndex(activePhysical, slides.length);

    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === activePhysical);
    });

    dots.forEach((dot, index) => {
      const isActive = index === logicalIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  const handleInfiniteLoop = () => {
    if (slideCount === 1 || isDragging || isJumping) return;

    const slides = getSlides();
    const activePhysical = getClosestPhysicalIndex();
    const totalSlides = slides.length;

    if (activePhysical === 0) {
      scrollToPhysical(slideCount, false);
      return;
    }

    if (activePhysical === totalSlides - 1) {
      scrollToPhysical(1, false);
    }
  };

  const onScrollSettled = () => {
    handleInfiniteLoop();
    updateActiveSlide();
  };

  const scheduleActiveUpdate = () => {
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(() => {
      scrollRaf = 0;
      updateActiveSlide();
    });
  };

  const startDrag = (pageX) => {
    isDragging = true;
    carousel.classList.add('is-dragging');
    startX = pageX;
    scrollLeft = carousel.scrollLeft;
  };

  const moveDrag = (pageX) => {
    if (!isDragging) return;
    const walk = (pageX - startX) * 1.15;
    carousel.scrollLeft = scrollLeft - walk;
    scheduleActiveUpdate();
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    carousel.classList.remove('is-dragging');
    onScrollSettled();
  };

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const logicalIndex = Number(dot.dataset.index);
      if (slideCount === 1) {
        scrollToPhysical(0, true);
        return;
      }
      scrollToPhysical(getPhysicalIndex(logicalIndex), true);
    });
  });

  carousel.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    startDrag(event.pageX);
  });

  carousel.addEventListener('mousemove', (event) => {
    if (!isDragging) return;
    event.preventDefault();
    moveDrag(event.pageX);
  });

  carousel.addEventListener('mouseup', endDrag);
  carousel.addEventListener('mouseleave', endDrag);

  carousel.addEventListener(
    'scroll',
    () => {
      scheduleActiveUpdate();
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(onScrollSettled, 140);
    },
    { passive: true },
  );

  carousel.addEventListener('scrollend', onScrollSettled);

  window.addEventListener('resize', () => {
    scheduleActiveUpdate();
    onScrollSettled();
  }, { passive: true });

  window.requestAnimationFrame(() => {
    scrollToPhysical(slideCount === 1 ? 0 : 1, false);
    onScrollSettled();
  });
}

initConversionLinks();
initImageFallbacks();
initMobileNav();
initSmoothScroll();
initStoryCarousel();
