/* facility-story.js */

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  const wrapper = document.querySelector(".story-wrapper");
  if (!wrapper) return;

  const steps = gsap.utils.toArray(".story-step");
  const progressFill = document.querySelector(".story-progress-fill");
  const progressCount = document.querySelector(".story-progress-count .current");
  const mainImage = document.querySelector(".story-visual-pane img");
  
  // Overlays
  const annotLine = document.querySelectorAll(".annot-line");
  const annotPoint = document.querySelectorAll(".annot-circle, .annot-text");
  
  const utilPaths = document.querySelectorAll(".util-path");
  
  const scannerLine = document.querySelector(".scanner-line");
  const scannerTargets = document.querySelectorAll(".scanner-target");
  
  const blueprintOverlay = document.querySelector(".story-blueprint");
  const blueprintStamp = document.querySelector(".blueprint-stamp");
  
  const comfortOverlay = document.querySelector(".story-comfort");

  // Create main timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      pin: ".story-sticky",
      onUpdate: (self) => {
        // Update progress bar
        gsap.set(progressFill, { scaleY: self.progress });
        
        // Update step counter
        const stepIndex = Math.min(Math.floor(self.progress * 5) + 1, 5);
        progressCount.innerText = `0${stepIndex}`;
      }
    }
  });

  // Base image zoom throughout the whole scroll
  tl.to(mainImage, { scale: 1.15, ease: "none", duration: 1 }, 0);

  // Manage Steps Opacity
  steps.forEach((step, i) => {
    if (i === 0) gsap.set(step, { autoAlpha: 1, y: 0 });
    else gsap.set(step, { autoAlpha: 0, y: 30 });
  });

  steps.forEach((step, i) => {
    const start = i * 0.2;
    const end = start + 0.2;
    
    if (i === 0) {
      // Step 1 is already visible at scroll 0. Just fade it out at the end of its stage.
      tl.to(step, { autoAlpha: 0, y: -30, duration: 0.05, ease: "power1.in" }, end - 0.05);
    } else {
      // Other steps fade in
      tl.fromTo(step, 
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, duration: 0.05, ease: "power1.out" },
        start + 0.02
      );
      // Fade out (except last step)
      if (i < 4) {
        tl.to(step, { autoAlpha: 0, y: -30, duration: 0.05, ease: "power1.in" }, end - 0.05);
      }
    }
  });

  /* === STAGE 1: Annotations (0.0 - 0.2) === */
  tl.to(annotLine, { strokeDashoffset: 0, duration: 0.1, ease: "power2.inOut" }, 0.02);
  tl.to(annotPoint, { opacity: 1, duration: 0.05, stagger: 0.01 }, 0.05);
  // Fade out for next stage
  tl.to([annotLine, annotPoint], { opacity: 0, duration: 0.05 }, 0.18);

  /* === STAGE 2: Utilities (0.2 - 0.4) === */
  tl.to(utilPaths, { strokeDashoffset: 0, duration: 0.15, ease: "none" }, 0.2);
  // Fade out for next stage
  tl.to(utilPaths, { opacity: 0, duration: 0.05 }, 0.38);

  /* === STAGE 3: Scanner (0.4 - 0.6) === */
  tl.fromTo(scannerLine, 
    { y: "-100vh" }, 
    { y: "100vh", duration: 0.15, ease: "none" }, 
    0.4
  );
  scannerTargets.forEach((target, i) => {
    tl.to(target, { opacity: 1, duration: 0.02 }, 0.42 + (i * 0.03));
  });
  // Fade out for next stage
  tl.to(scannerLine, { opacity: 0, duration: 0.02 }, 0.55);
  tl.to(scannerTargets, { opacity: 0, duration: 0.05 }, 0.58);

  /* === STAGE 4: Blueprint (0.6 - 0.8) === */
  tl.to(mainImage, { 
    filter: "grayscale(1) invert(1) contrast(1.2)", 
    duration: 0.05 
  }, 0.6);
  tl.to(blueprintOverlay, { opacity: 1, duration: 0.05 }, 0.6);
  tl.to(blueprintStamp, { opacity: 1, scale: 1, rotate: -15, duration: 0.05, ease: "back.out(1.7)" }, 0.7);

  /* === STAGE 5: Comfort (0.8 - 1.0) === */
  tl.to(mainImage, { 
    filter: "sepia(0.3) saturate(1.5) contrast(1.1)", 
    duration: 0.1 
  }, 0.82);
  tl.to([blueprintOverlay, blueprintStamp], { opacity: 0, duration: 0.05 }, 0.82);
  tl.to(comfortOverlay, { opacity: 1, duration: 0.1 }, 0.85);

});
