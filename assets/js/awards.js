/* awards.js - Cinematic Document Scanner Animation */

document.addEventListener("DOMContentLoaded", function () {
  gsap.registerPlugin(ScrollTrigger);

  const section = document.querySelector(".scanner-section");
  const docs = document.querySelectorAll(".scanner-doc");
  const numCurrent = document.querySelector(".progress-current");
  const progressBar = document.querySelector(".progress-bar");

  if (!section || docs.length === 0) return;

  // Set initial states
  gsap.set(docs, {
    opacity: 0,
    z: -300,
    scale: 0.8,
    y: 100
  });

  gsap.set(".doc-scan-area", { clipPath: "inset(0 0 100% 0)" });
  gsap.set(".doc-info", { opacity: 0, y: 30 });

  const totalDocs = docs.length;
  // Make the pinning scroll length proportional to the number of docs
  const scrollDistance = totalDocs * 200 + "vh";

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=" + scrollDistance,
      pin: true,
      scrub: 1, // Smooth scrubbing
      onUpdate: (self) => {
        // Update progress bar
        gsap.to(progressBar, { width: self.progress * 100 + "%", duration: 0.1 });
      }
    }
  });

  docs.forEach((doc, i) => {
    const scanArea = doc.querySelector(".doc-scan-area");
    const info = doc.querySelector(".doc-info");

    // Start label for this document's sequence
    const startLabel = "doc" + i;
    tl.add(startLabel);

    // Update the counter
    tl.call(() => {
      if (numCurrent) {
        numCurrent.textContent = String(i + 1).padStart(2, '0');
      }
    }, null, startLabel);

    // 1. Bring document forward and center
    tl.to(doc, {
      opacity: 1,
      z: 0,
      scale: 1,
      y: 0,
      duration: 1,
      ease: "power2.out"
    }, startLabel);

    // 2. Scanner sweeps down
    tl.to(scanArea, {
      clipPath: "inset(0 0 0% 0)",
      duration: 2,
      ease: "none"
    }, startLabel + "+=0.5"); // Start scanning while it's still settling

    // 3. Reveal document info as scanner passes middle
    tl.to(info, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out"
    }, startLabel + "+=1.2");

    // 4. Subtle camera zoom on the document to hold focus
    tl.to(doc, {
      scale: 1.05,
      duration: 1.5,
      ease: "none"
    }, startLabel + "+=2");

    // 5. Move document backward/upward to make room for the next (except last one)
    if (i < totalDocs - 1) {
      tl.to(doc, {
        opacity: 0,
        z: 200,
        y: -100,
        duration: 1,
        ease: "power2.in"
      }, startLabel + "+=3.5");
    }
  });
});
