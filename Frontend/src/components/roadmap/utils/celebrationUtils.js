/**
 * Utility functions for handling celebration effects
 */
import confetti from 'canvas-confetti';

/**
 * Triggers a celebration effect with confetti
 * @param {Function} setShowCelebration - Function to set celebration modal visibility
 * @returns {void}
 */
export const triggerCelebration = (setShowCelebration) => {
  console.log('Triggering celebration!');
  
  const duration = 5 * 1000; // 5 seconds
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 9999,
    colors: ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#22c55e']
  };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Initial burst
  confetti({
    ...defaults,
    particleCount: 100,
    origin: { x: 0.5, y: 0.7 },
    angle: 60,
    spread: 70
  });
  confetti({
    ...defaults,
    particleCount: 100,
    origin: { x: 0.5, y: 0.7 },
    angle: 120,
    spread: 70
  });

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Confetti from multiple angles
    confetti({
      ...defaults,
      particleCount: particleCount / 2,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    
    confetti({
      ...defaults,
      particleCount: particleCount / 2,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });

    // Center burst
    if (Math.random() > 0.7) {
      confetti({
        ...defaults,
        particleCount: 30,
        origin: { x: 0.5, y: 0.7 },
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70)
      });
    }
  }, 250);

  setShowCelebration(true);
  setTimeout(() => setShowCelebration(false), duration);
}; 