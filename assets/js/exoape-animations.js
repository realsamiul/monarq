/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXOAPE-CORE.JS - Complete Animation System
 * ═══════════════════════════════════════════════════════════════════════════
 * * Version: 1.1.0 (Edited)
 * MODIFICATION: Removed the original 'Navigation' class (section 9)
 * to prevent conflicts with 'dynamic-island.js'.
 * The Dynamic Island script now controls all navigation.
 * * ═══════════════════════════════════════════════════════════════════════════
 */

(function(window) {
  'use strict';

  // ═════════════════════════════════════════════════════════════════════════
  // 1. CUSTOM EASE CURVES (Exact from Exo Ape source)
  // ═════════════════════════════════════════════════════════════════════════

  const ExoEases = {
    main: 'cubic-bezier(0.496, 0.004, 0, 1)',
    text: 'cubic-bezier(0, 0.202, 0.204, 1)',
    image: 'cubic-bezier(0.198, 0, 1, 0.1)'
  };

  // Register GSAP eases
  function registerEases() {
    if (typeof gsap === 'undefined') {
      console.error('❌ GSAP not found. Please include GSAP before this script.');
      return false;
    }

    if (typeof CustomEase !== 'undefined') {
      gsap.registerPlugin(CustomEase);
      CustomEase.create('exoMain', 'M0,0 C0.496,0.004 0,1 1,1');
      CustomEase.create('exoText', 'M0,0 C0,0.202 0.204,1 1,1');
      CustomEase.create('exoImage', 'M0,0 C0.198,0 1,0.1 1,1');
    }

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    return true;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. UTILITY FUNCTIONS
  // ═════════════════════════════════════════════════════════════════════════

  const Utils = {
    lerp: (start, end, factor) => start + (end - start) * factor,
    
    clamp: (num, min, max) => Math.min(Math.max(num, min), max),
    
    map: (num, inMin, inMax, outMin, outMax) => 
      ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin,
    
    isMobile: () => window.innerWidth <= 768,
    
    isTouch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    
    inView: (element, threshold = 0) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      return rect.top < windowHeight - threshold && rect.bottom > threshold;
    },
    
    getScrollProgress: (element) => {
      if (!element) return 0;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;
      const scrolled = windowHeight - rect.top;
      return Math.max(0, Math.min(1, scrolled / (windowHeight + elementHeight)));
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // 3. SMOOTH SCROLL
  // Targets: body, all pages
  // ═════════════════════════════════════════════════════════════════════════

  class SmoothScroll {
    constructor(options = {}) {
      this.current = 0;
      this.target = 0;
      this.ease = options.ease || 0.1;
      this.isMobile = Utils.isMobile();
      this.maxScroll = 0;
      
      if (!this.isMobile) {
        this.init();
      }
    }
    
    init() {
      // Setup fixed body for smooth scroll
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.width = '100%';
      document.body.style.overflowY = 'hidden';
      
      this.updateMaxScroll();
      this.addEventListeners();
      this.animate();
    }
    
    updateMaxScroll() {
      this.maxScroll = document.body.scrollHeight - window.innerHeight;
    }
    
    addEventListeners() {
      // Wheel
      window.addEventListener('wheel', (e) => {
        this.target += e.deltaY;
        this.target = Utils.clamp(this.target, 0, this.maxScroll);
      }, { passive: true });
      
      // Touch
      let touchStart = 0;
      window.addEventListener('touchstart', (e) => {
        touchStart = e.touches[0].clientY;
      }, { passive: true });
      
      window.addEventListener('touchmove', (e) => {
        const delta = touchStart - e.touches[0].clientY;
        this.target += delta;
        this.target = Utils.clamp(this.target, 0, this.maxScroll);
        touchStart = e.touches[0].clientY;
      }, { passive: true });
      
      // Resize
      window.addEventListener('resize', () => {
        this.updateMaxScroll();
        this.isMobile = Utils.isMobile();
        if (this.isMobile) this.destroy();
      });
      
      // Keyboard
      window.addEventListener('keydown', (e) => {
        switch(e.key) {
          case 'ArrowDown': this.target += 50; break;
          case 'ArrowUp': this.target -= 50; break;
          case 'PageDown': this.target += window.innerHeight * 0.8; break;
          case 'PageUp': this.target -= window.innerHeight * 0.8; break;
          case 'Home': this.target = 0; break;
          case 'End': this.target = this.maxScroll; break;
        }
        this.target = Utils.clamp(this.target, 0, this.maxScroll);
      });
    }
    
    animate() {
      this.current = Utils.lerp(this.current, this.target, this.ease);
      
      document.body.style.transform = `translate3d(0, ${-this.current}px, 0)`;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('exoscroll', { 
        detail: { 
          scrollY: this.current,
          progress: this.maxScroll > 0 ? this.current / this.maxScroll : 0
        }
      }));
      
      requestAnimationFrame(() => this.animate());
    }
    
    scrollTo(targetY, duration = 1) {
      gsap.to(this, {
        target: targetY,
        duration: duration,
        ease: 'exoMain'
      });
    }
    
    destroy() {
      document.body.style.position = '';
      document.body.style.overflowY = '';
      document.body.style.transform = '';
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. PAGE TRANSITIONS
  // Targets: body, .page-content (for inter-page navigation)
  // ═════════════════════════════════════════════════════════════════════════

  class PageTransition {
    constructor() {
      this.isTransitioning = false;
    }
    
    enter(element, onComplete) {
      this.isTransitioning = true;
      
      const tl = gsap.timeline({ 
        onComplete: () => {
          this.isTransitioning = false;
          document.body.classList.remove('is-loading');
          if (onComplete) onComplete();
        }
      });
      
      tl.fromTo(element, 
        {
          clipPath: 'polygon(0% 100%, 100% 110%, 100% 100%, 0% 100%)',
          zIndex: 2
        },
        {
          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
          duration: 1,
          ease: 'exoMain',
          clearProps: 'clipPath,zIndex'
        }
      );
      
      const content = element.querySelector('.page-content') || element;
      tl.fromTo(content,
        {
          scale: 1.3,
          rotate: 7,
          y: window.innerHeight / 2
        },
        {
          scale: 1,
          rotate: 0,
          y: 0,
          duration: 1,
          ease: 'exoMain',
          clearProps: 'all'
        },
        0
      );
      
      return tl;
    }
    
    leave(element, onComplete) {
      this.isTransitioning = true;
      document.body.classList.add('is-loading');
      
      const content = element.querySelector('.page-content') || element;
      
      return gsap.to(content, {
        scale: 1.3,
        rotate: -7,
        y: -window.innerHeight / 2,
        duration: 1,
        ease: 'exoMain',
        onComplete: () => {
          this.isTransitioning = false;
          if (onComplete) onComplete();
        }
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. TITLE SPLIT ANIMATION
  // Targets: .title elements (found 4 in index, 12 in studio, 1 in story)
  // ═════════════════════════════════════════════════════════════════════════

  class TitleSplit {
    constructor(element, options = {}) {
      this.element = element;
      this.lines = [];
      this.visible = false;
      this.threshold = options.threshold || window.innerHeight / 1.5;
      this.autoAnimate = options.autoAnimate !== false;
      
      this.split();
      if (this.autoAnimate) this.setupRAF();
    }
    
    split() {
      // Check if already has title-mask structure
      const existingMasks = this.element.querySelectorAll('.title-mask');
      
      if (existingMasks.length > 0) {
        existingMasks.forEach(mask => {
          const line = mask.querySelector('.title-line');
          if (line) this.lines.push(line);
        });
      } else {
        // Create structure from text
        const text = this.element.textContent;
        const words = text.trim().split(/\s+/);
        
        this.element.innerHTML = '';
        
        words.forEach(word => {
          const mask = document.createElement('div');
          mask.className = 'title-mask';
          mask.style.overflow = 'hidden';
          mask.style.display = 'inline-block';
          
          const line = document.createElement('div');
          line.className = 'title-line';
          line.style.display = 'inline-block';
          line.textContent = word + ' ';
          
          mask.appendChild(line);
          this.element.appendChild(mask);
          this.lines.push(line);
        });
      }
      
      gsap.set(this.lines, { 
        autoAlpha: 0,
        rotation: 7,
        yPercent: 100
      });
    }
    
    setupRAF() {
      const check = () => {
        if (Utils.inView(this.element, this.threshold) && !this.visible) {
          this.animate();
        }
        if (!this.visible) requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    }
    
    animate() {
      this.visible = true;
      
      gsap.fromTo(this.lines,
        { autoAlpha: 0, rotation: 7, yPercent: 100 },
        {
          autoAlpha: 1,
          rotation: 0,
          yPercent: 0,
          stagger: 0.1,
          duration: 1,
          ease: 'exoText'
        }
      );
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. MARQUEE ANIMATION
  // Targets: .marquee (found in studio.html)
  // ═════════════════════════════════════════════════════════════════════════

  class Marquee {
    constructor(element, options = {}) {
      this.element = element;
      this.speed = options.speed || 1;
      this.direction = options.direction || 'left';
      
      this.setup();
    }
    
    setup() {
      const content = this.element.innerHTML;
      this.element.innerHTML = content + content;
      
      gsap.set(this.element, { x: 0 });
      this.animate();
    }
    
    animate() {
      const width = this.element.scrollWidth / 2;
      const direction = this.direction === 'left' ? -1 : 1;
      
      gsap.to(this.element, {
        x: direction * width,
        duration: 20 / this.speed,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: (x) => `${parseFloat(x) % width}px`
        }
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. IMAGE BLOOM
  // Targets: .project .block, .image containers
  // ═════════════════════════════════════════════════════════════════════════

  class ImageBloom {
    constructor(element, options = {}) {
      this.element = element;
      this.scaleAmount = options.scale || 1.2;
      this.trigger = options.trigger || 'scroll';
      
      this.init();
    }
    
    init() {
      if (this.trigger === 'hover') {
        this.setupHover();
      } else {
        this.setupScroll();
      }
    }
    
    setupHover() {
      const img = this.element.querySelector('img') || this.element;
      
      this.element.addEventListener('mouseenter', () => {
        gsap.to(img, {
          scale: this.scaleAmount,
          duration: 0.6,
          ease: 'exoImage'
        });
      });
      
      this.element.addEventListener('mouseleave', () => {
        gsap.to(img, {
          scale: 1,
          duration: 0.6,
          ease: 'exoImage'
        });
      });
    }
    
    setupScroll() {
      if (typeof ScrollTrigger === 'undefined') return;
      
      const img = this.element.querySelector('img') || this.element;
      
      ScrollTrigger.create({
        trigger: this.element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const scale = 1 + (self.progress * (this.scaleAmount - 1));
          gsap.to(img, {
            scale: scale,
            duration: 0.1,
            ease: 'exoImage',
            overwrite: 'auto'
          });
        }
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. PARALLAX
  // Targets: elements with data-exo-parallax attribute
  // ═════════════════════════════════════════════════════════════════════════

  class Parallax {
    constructor(element, options = {}) {
      this.element = element;
      this.speed = options.speed || 0.5;
      this.direction = options.direction || 'y';
      this.distance = options.distance || 30;
      
      this.init();
    }
    
    init() {
      if (typeof ScrollTrigger === 'undefined') return;
      
      const movement = this.direction === 'y' ? 'yPercent' : 'xPercent';
      const value = this.distance * this.speed;
      
      gsap.fromTo(this.element, 
        { [movement]: -value / 2 },
        {
          [movement]: value / 2,
          ease: 'none',
          scrollTrigger: {
            trigger: this.element.parentElement || this.element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          }
        }
      );
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 9. NAVIGATION MENU (REMOVED)
  // 
  // This section was removed to prevent conflicts with dynamic-island.js,
  // which now handles all navigation controls and menu logic.
  // 
  // ═════════════════════════════════════════════════════════════════════════


  // ═════════════════════════════════════════════════════════════════════════
  // 10. SCROLL TO INDICATOR
  // Targets: .scroll-to (found in index.html, studio.html)
  // ═════════════════════════════════════════════════════════════════════════

  class ScrollTo {
    constructor(element, options = {}) {
      this.element = element;
      this.threshold = options.threshold || 100;
      this.targetY = options.targetY || window.innerHeight;
      
      this.init();
    }
    
    init() {
      if (!this.element) return;
      
      const updateVisibility = (scrollY) => {
        gsap.to(this.element, {
          autoAlpha: scrollY > this.threshold ? 0 : 1,
          duration: 0.3,
          ease: 'exoMain'
        });
      };
      
      window.addEventListener('exoscroll', (e) => updateVisibility(e.detail.scrollY));
      window.addEventListener('scroll', () => updateVisibility(window.pageYOffset));
      
      this.element.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.Exo?.smoothScroll) {
          window.Exo.smoothScroll.scrollTo(this.targetY, 1);
        } else {
          window.scrollTo({ top: this.targetY, behavior: 'smooth' });
        }
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 11. CANVAS VIDEO SEQUENCE
  // Targets: canvas elements (found 4 in story.html)
  // ═════════════════════════════════════════════════════════════════════════

  class CanvasVideo {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      if (!this.canvas) return;
      
      this.ctx = this.canvas.getContext('2d');
      this.frameCount = options.frameCount || 150;
      this.folder = options.folder || '/frames';
      this.filePrefix = options.filePrefix || 'frame-';
      this.fileExtension = options.fileExtension || 'png';
      this.images = [];
      this.currentFrame = 0;
      this.imagesLoaded = 0;
      this.isReady = false;
      
      this.setCanvasSize();
      this.preloadImages();
      this.setupListeners();
    }
    
    setCanvasSize() {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = `${window.innerWidth}px`;
      this.canvas.style.height = `${window.innerHeight}px`;
      this.ctx.scale(dpr, dpr);
    }
    
    preloadImages() {
      for (let i = 0; i < this.frameCount; i++) {
        const img = new Image();
        img.src = `${this.folder}/${this.filePrefix}${String(i).padStart(4, '0')}.${this.fileExtension}`;
        
        img.onload = () => {
          this.imagesLoaded++;
          if (this.imagesLoaded === this.frameCount) {
            this.isReady = true;
            this.render();
          }
        };
        
        img.onerror = () => {
          console.warn(`Failed to load: ${img.src}`);
          this.imagesLoaded++;
        };
        
        this.images.push(img);
      }
    }
    
    setupListeners() {
      window.addEventListener('exoscroll', (e) => this.updateFrame(e.detail.progress));
      window.addEventListener('scroll', () => {
        const progress = window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
        this.updateFrame(progress);
      });
      window.addEventListener('resize', () => {
        this.setCanvasSize();
        this.render();
      });
    }
    
    updateFrame(progress) {
      if (!this.isReady) return;
      
      const frameIndex = Math.min(
        this.frameCount - 1,
        Math.floor(progress * this.frameCount)
      );
      
      if (frameIndex !== this.currentFrame) {
        this.currentFrame = frameIndex;
        this.render();
      }
    }
    
    render() {
      const img = this.images[this.currentFrame];
      if (!img || !img.complete) return;
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      const canvasRatio = this.canvas.width / this.canvas.height;
      const imgRatio = img.width / img.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (canvasRatio > imgRatio) {
        drawWidth = this.canvas.width;
        drawHeight = this.canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (this.canvas.height - drawHeight) / 2;
      } else {
        drawHeight = this.canvas.height;
        drawWidth = this.canvas.height * imgRatio;
        offsetX = (this.canvas.width - drawWidth) / 2;
        offsetY = 0;
      }
      
      this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 12. VIDEO HOVER PLAY
  // Targets: .project video, .block video (for video thumbnails)
  // ═════════════════════════════════════════════════════════════════════════

  class VideoHover {
    constructor(element, options = {}) {
      this.element = element;
      this.video = element.querySelector('video');
      this.playDelay = options.playDelay || 300;
      this.pauseDelay = options.pauseDelay || 100;
      
      if (this.video) this.init();
    }
    
    init() {
      let playTimeout, pauseTimeout;
      
      this.element.addEventListener('mouseenter', () => {
        clearTimeout(pauseTimeout);
        playTimeout = setTimeout(() => {
          this.video.play().catch(() => {});
        }, this.playDelay);
      });
      
      this.element.addEventListener('mouseleave', () => {
        clearTimeout(playTimeout);
        pauseTimeout = setTimeout(() => {
          this.video.pause();
          this.video.currentTime = 0;
        }, this.pauseDelay);
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 13. FADE IN ON SCROLL
  // Targets: .animate, elements with data-exo-fade-in
  // ═════════════════════════════════════════════════════════════════════════

  class FadeIn {
    constructor(element, options = {}) {
      this.element = element;
      this.threshold = options.threshold || 0.2;
      this.delay = options.delay || 0;
      this.duration = options.duration || 0.8;
      this.y = options.y || 50;
      
      this.init();
    }
    
    init() {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.from(this.element, {
          y: this.y,
          autoAlpha: 0,
          duration: this.duration,
          delay: this.delay,
          ease: 'exoImage',
          scrollTrigger: {
            trigger: this.element,
            start: `top ${100 - this.threshold * 100}%`,
            once: true
          }
        });
      } else {
        gsap.set(this.element, { autoAlpha: 0, y: this.y });
        
        const check = () => {
          if (Utils.inView(this.element, window.innerHeight * this.threshold)) {
            gsap.to(this.element, {
              y: 0,
              autoAlpha: 1,
              duration: this.duration,
              delay: this.delay,
              ease: 'exoImage'
            });
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 14. LINK BUTTON ANIMATION
  // Targets: a.link (found 19 in index, 11 in studio, 1 in story)
  // ═════════════════════════════════════════════════════════════════════════

  class LinkButton {
    constructor(element, options = {}) {
      this.element = element;
      this.circleFill = element.querySelector('.circle-fill');
      this.circleIcon = element.querySelector('.circle-icon, .icon-arrow');
      this.duration = options.duration || 0.4;
      
      if (this.circleFill || this.circleIcon) this.init();
    }
    
    init() {
      this.element.addEventListener('mouseenter', () => {
        if (this.circleFill) {
          gsap.to(this.circleFill, {
            scale: 1,
            duration: this.duration,
            ease: 'exoImage'
          });
        }
        
        if (this.circleIcon) {
          // Icon animation on hover
          gsap.to(this.circleIcon, {
            x: '0.2vw', // Use a relative value for movement
            duration: this.duration,
            ease: 'exoImage'
          });
        }
      });
      
      this.element.addEventListener('mouseleave', () => {
        if (this.circleFill) {
          gsap.to(this.circleFill, {
            scale: 0,
            duration: this.duration,
            ease: 'exoImage'
          });
        }
        
        if (this.circleIcon) {
          // The incomplete logic ends here
          gsap.to(this.circleIcon, {
            x: 0,
            duration: this.duration,
            ease: 'exoImage'
          });
        }
      });
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 15. VIEWPORT HEIGHT FIX
  // ═════════════════════════════════════════════════════════════════════════

  function viewportFix() {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 16. MAIN API & AUTO-INITIALIZATION
  // ═════════════════════════════════════════════════════════════════════════

  const Exo = {
    // Core instances
    smoothScroll: null,
    pageTransition: null,
    
    // Collections
    titleSplits: [],
    marquees: [],
    imageBlooms: [],
    parallaxElements: [],
    canvasVideos: [],
    videoHovers: [],
    fadeIns: [],
    linkButtons: [],
    scrollTos: [],
    
    init(options = {}) {
      
      if (!registerEases()) {
        return;
      }
      
      
      // Viewport fix
      viewportFix();
      
      // Smooth scroll
      if (!options.disableSmoothScroll && !Utils.isMobile()) {
        this.smoothScroll = new SmoothScroll(options.smoothScroll || {});
      }
      
      // Page transitions
      this.pageTransition = new PageTransition();
      
      // Auto-init elements
      this.autoInit();
      
    },
    
    autoInit() {
      // Titles (4 in index, 12 in studio, 1 in story)
      document.querySelectorAll('.title, [data-exo-title]').forEach(el => {
        this.titleSplits.push(new TitleSplit(el));
      });
      if (this.titleSplits.length) {
      }
      
      // Marquee (studio.html only)
      document.querySelectorAll('.marquee, [data-exo-marquee]').forEach(el => {
        const speed = parseFloat(el.dataset.exoMarquee) || 1;
        this.marquees.push(new Marquee(el, { speed }));
      });
      if (this.marquees.length) {
      }
      
      // Image bloom
      document.querySelectorAll('[data-exo-bloom]').forEach(el => {
        const trigger = el.dataset.exoBloom || 'scroll';
        this.imageBlooms.push(new ImageBloom(el, { trigger }));
      });
      
      // Parallax
      document.querySelectorAll('[data-exo-parallax]').forEach(el => {
        const speed = parseFloat(el.dataset.exoParallax) || 0.5;
        this.parallaxElements.push(new Parallax(el, { speed }));
      });
      if (this.parallaxElements.length) {
      }
      
      // Scroll indicators
      document.querySelectorAll('.scroll-to, [data-exo-scroll-to]').forEach(el => {
        this.scrollTos.push(new ScrollTo(el));
      });
      if (this.scrollTos.length) {
      }
      
      // Canvas videos (story.html has 4)
      document.querySelectorAll('canvas[data-exo-canvas]').forEach(el => {
        const frameCount = parseInt(el.dataset.exoCanvas) || 150;
        const folder = el.dataset.exoFolder || '/frames';
        this.canvasVideos.push(new CanvasVideo(el, { frameCount, folder }));
      });
      if (this.canvasVideos.length) {
      }
      
      // Video hovers
      document.querySelectorAll('.project, .block').forEach(el => {
        if (el.querySelector('video')) {
          this.videoHovers.push(new VideoHover(el));
        }
      });
      if (this.videoHovers.length) {
      }
      
      // Fade-ins
      document.querySelectorAll('.animate, [data-exo-fade-in]').forEach(el => {
        this.fadeIns.push(new FadeIn(el));
      });
      if (this.fadeIns.length) {
      }
      
      // Link buttons (19 in index, 11 in studio, 1 in story)
      document.querySelectorAll('.link').forEach(el => {
        this.linkButtons.push(new LinkButton(el));
      });
      if (this.linkButtons.length) {
      }
    },
    
    scrollTo(targetY, duration) {
      if (this.smoothScroll) {
        this.smoothScroll.scrollTo(targetY, duration);
      } else {
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    },
    
    refresh() {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    },
    
    destroy() {
      if (this.smoothScroll) this.smoothScroll.destroy();
      
      this.titleSplits = [];
      this.marquees = [];
      this.imageBlooms = [];
      this.parallaxElements = [];
      this.canvasVideos = [];
      this.videoHovers = [];
      this.fadeIns = [];
      this.linkButtons = [];
      this.scrollTos = [];
      
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach(st => st.kill());
      }
      
      gsap.globalTimeline.clear();
    }
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Exo.init());
  } else {
    Exo.init();
  }

  // Export
  window.Exo = Exo;

})(window);
