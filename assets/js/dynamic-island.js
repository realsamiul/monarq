// Register GSAP plugins
gsap.registerPlugin(ScrollToPlugin, TextPlugin);
gsap.config({ trialWarn: false });
// Custom eases
CustomEase.create("expandEase", "M0,0 C0.25,0.1 0.39,0.29 0.62,0.62 0.83,0.84 1,1 1,1");
class ScrambleText {
    constructor(element) {
        this.element = element;
        this.chars = "!#$%&'()*+,-./:;<=>?@[]^_`{|}~";
        this.originalText = element.textContent;
    }

    scramble(newText, duration = 0.8) {
        const oldText = this.element.textContent;
        const maxLength = Math.max(oldText.length, newText.length);
        const scrambleDuration = duration * 0.8;
        
        let frame = 0;
        const totalFrames = scrambleDuration * 60; // 60fps
        
        const scrambleInterval = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
   
     
            let scrambled = '';
            for (let i = 0; i < maxLength; i++) {
                if (i < newText.length * progress) {
 
                    scrambled += newText[i];
                } else if (i < maxLength) {
                    scrambled += this.chars[Math.floor(Math.random() * this.chars.length)];
         
                }
            }
            
            this.element.textContent = scrambled.substring(0, maxLength);
            
  
            if (frame >= totalFrames) {
                clearInterval(scrambleInterval);
                this.element.textContent = newText;
            }
        
        }, 1000 / 60);
        
        return scrambleInterval;
    }
}

class DynamicIslandNav {
    constructor() {
        // Auto-detect sections
        this.sections = document.querySelectorAll('[data-nav-section], .nav-section');
        this.island = document.getElementById('dynamicIsland');
        this.textElement = document.querySelector('.text-content');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.menuButton = document.getElementById('menuButton');
        this.menuPanel = document.getElementById('menuPanel');
        this.menuItems = this.menuPanel.querySelectorAll('.menu-item');
        this.progressBar = document.getElementById('progressBar');

        this.scrambler = new ScrambleText(this.textElement);
        this.state = {
            currentIndex: 0,
            isExpanded: false,
            isMenuOpen: false,
            isAnimating: false,
      
            idleTimeout: null,
            scrambleInterval: null,
            morphTimeout: null
        };
        this.processSections();
        this.init();
    }

    processSections() {
        this.sections.forEach((section, index) => {
            section.dataset.index = index;
            
            if (!section.dataset.navTitle) {

                const heading = section.querySelector('h1, h2, h3');
                if (heading) {
                    section.dataset.navTitle = heading.textContent.trim();
         
                } else {
                    section.dataset.navTitle = `Section ${index + 1}`;
                }
            }
      
        });
    }

    init() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.updateProgress();
        
        // Set initial text
        const firstTitle = this.sections[0].dataset.navTitle.toUpperCase();
        this.textElement.textContent = firstTitle;
        
        // Start idle animation
        this.startIdleAnimation();
        this.updatePageMenu();
    }

    startIdleAnimation() {
        // Clear any existing timeout
        if (this.state.morphTimeout) {
            clearTimeout(this.state.morphTimeout);
        }

        // Only animate when not expanded and not in menu
        if (!this.state.isExpanded && !this.state.isMenuOpen) {
            this.state.morphTimeout = setTimeout(() => {
                if (!this.state.isExpanded && !this.state.isMenuOpen) {

                    this.glitchText();
                    this.startIdleAnimation();
                }
            }, 3000 + 
            Math.random() * 2000);
        }
    }

    glitchText() {
        const currentText = this.textElement.textContent;
        const glitchChars = "!@#$%^&*()_+";
        
        // Add glitch class for visual effect
        this.textElement.classList.add('glitching');
        // Quick glitch animation
        let glitchCount = 0;
        const glitchInterval = setInterval(() => {
            if (glitchCount < 5) {
                let glitched = '';
                for (let i = 0; i < currentText.length; i++) {
   
                    if (Math.random() < 0.1) {
                        glitched += glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    } else {
     
                        glitched += currentText[i];
                    }
                }
                this.textElement.textContent = glitched;

                glitchCount++;
            } else {
                clearInterval(glitchInterval);
                this.textElement.textContent = currentText;
     
                this.textElement.classList.remove('glitching');
            }
        }, 50);
    }

    updateText(newText) {
        if (this.state.isAnimating) return;
        this.state.isAnimating = true;

        // Clear any existing scramble
        if (this.state.scrambleInterval) {
            clearInterval(this.state.scrambleInterval);
        }

        // Stop idle animation during text change
        if (this.state.morphTimeout) {
            clearTimeout(this.state.morphTimeout);
        }

        // Scramble to new text
        this.state.scrambleInterval = this.scrambler.scramble(newText.toUpperCase(), 0.6);
        setTimeout(() => {
            this.state.isAnimating = false;
            if (!this.state.isExpanded) {
                this.startIdleAnimation();
            }
  
        }, 600);
    }

    updatePageMenu() {
        const currentPath = window.location.pathname.split('/').pop(); // Get the file name
        this.menuItems.forEach(item => {
            const itemPath = new URL(item.href).pathname.split('/').pop();
            // Use endsWith to handle potential relative path differences
            item.classList.toggle('active', currentPath === itemPath);
        });
    }

    setupEventListeners() {
        // Island expansion
        this.island.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-arrow')) {
                this.toggleExpanded(!this.state.isExpanded);
    
            }
        });
        // Menu button
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        // Navigation arrows
        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateToSection(this.state.currentIndex - 1);
            this.resetIdleTimer();
        });
        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigateToSection(this.state.currentIndex + 1);
            this.resetIdleTimer();
        });
        // Click outside
        document.addEventListener('click', (e) => {
            if (!this.island.contains(e.target) && !this.menuButton.contains(e.target)) {
                this.toggleExpanded(false);
                this.toggleMenu(false);
       
            }
        });
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                this.navigateToSection(this.state.currentIndex - 1);
            } else if (e.key === 
            'ArrowDown' || e.key === 'ArrowRight') {
                this.navigateToSection(this.state.currentIndex + 1);
            } else if (e.key === 'Escape') {
                this.toggleExpanded(false);
           
                this.toggleMenu(false);
            }
        });
        // Touch gestures
        let touchStartY = 0;
        this.island.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        this.island.addEventListener('touchend', (e) => {
            const touchEndY = e.changedTouches[0].clientY;
            const diff = touchStartY - touchEndY;
            if (Math.abs(diff) > 50) {
                this.navigateToSection(this.state.currentIndex 
                + (diff > 0 ? 1 : -1));
            }
        });
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
           
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.dataset.index);
                        if (index !== this.state.currentIndex) {
                  
                            this.updateCurrentSection(index);
                        }
                    }
              
                });
            },
            { threshold: 0.6 }
        );
        this.sections.forEach(section => observer.observe(section));
    }

    updateCurrentSection(index) {
        this.state.currentIndex = index;
        const section = this.sections[index];
        const title = section.dataset.navTitle;
        
        this.updateText(title);
        
        this.sections.forEach(s => s.classList.remove('active'));
        section.classList.add('active');
        
        this.updateProgress();
    }

    resetIdleTimer() {
        if (this.state.idleTimeout) {
            clearTimeout(this.state.idleTimeout);
        }

        if (this.state.isExpanded) {
            this.state.idleTimeout = setTimeout(() => {
                this.toggleExpanded(false);
            }, 5000);
        }
    }

    toggleExpanded(shouldExpand) {
        this.state.isExpanded = shouldExpand;
        if (shouldExpand) {
            this.island.classList.add('expanded');
            this.resetIdleTimer();
            // Stop idle animation when expanded
            if (this.state.morphTimeout) {
                clearTimeout(this.state.morphTimeout);
            }
        } else {
            this.island.classList.remove('expanded');
            if (this.state.idleTimeout) {
                clearTimeout(this.state.idleTimeout);
            }
            // Restart idle animation when collapsed
            this.startIdleAnimation();
        }

        // Smooth width transition
        gsap.to(this.island, {
            width: shouldExpand ? 'var(--island-width-expanded)' : 'var(--island-width-collapsed)',
            duration: 0.4,
          
            ease: "expandEase"
        });
        // Arrow animations
        gsap.to([this.prevBtn, this.nextBtn], {
            opacity: shouldExpand ? 1 : 0,
            scale: shouldExpand ? 1 : 0.6,
            pointerEvents: shouldExpand ? 'all' : 'none',
     
            duration: 0.3,
            ease: "power2.inOut",
            stagger: shouldExpand ? 0.05 : 0
        });
    }

    toggleMenu(force = null) {
        const shouldOpen = force !== null ?
        force : !this.state.isMenuOpen;
        this.state.isMenuOpen = shouldOpen;

        this.menuButton.classList.toggle('menu-open', shouldOpen);

        gsap.to(this.menuPanel, {
            opacity: shouldOpen ? 1 : 0,
            scale: shouldOpen ? 1 : 0.8,
            pointerEvents: shouldOpen ? 'all' : 'none',
        
            duration: 0.3,
            ease: "power2.inOut"
        });
        if (shouldOpen) {
            gsap.fromTo(this.menuItems, 
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, stagger: 0.03, delay: 0.1 }
     
            );
        }
    }

    navigateToSection(index) {
        if (this.state.isAnimating) return;
        const clampedIndex = Math.max(0, Math.min(this.sections.length - 1, index));
        if (clampedIndex === this.state.currentIndex) return;
        
        // Check for smooth scroll module first
        if (window.Exo && window.Exo.smoothScroll) {
             window.Exo.smoothScroll.scrollTo(this.sections[clampedIndex].offsetTop, 1);
        } else {
            // Fallback to GSAP ScrollTo or native
            if (gsap.plugins.scrollTo) {
                 gsap.to(window, {
                    scrollTo: {
                        y: this.sections[clampedIndex],
                        autoKill: false
                    },
                    duration: 1,
                    ease: "power2.inOut"
                });
            } else {
                // Native fallback
                this.sections[clampedIndex].scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    }

    updateProgress() {
        const progress = ((this.state.currentIndex + 1) / this.sections.length) * 100;
        gsap.to(this.progressBar, {
            width: `${progress}%`,
            duration: 0.6,
            ease: "power2.inOut"
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Ensure sections are loaded before init
    setTimeout(() => {
        window.dynamicIslandNav = new DynamicIslandNav();
    }, 100); // Small delay to ensure DOM is fully parsed
});
