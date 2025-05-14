import {
  motionVariants,
  createStaggerChildren,
  animationClasses,
  staggered,
  fadeIn,
} from './motions';

describe('Animation Motions', () => {
  it('should define keyframes', () => {
    expect(fadeIn).toBeDefined();
  });

  describe('motionVariants', () => {
    it('should have correct structure for fadeIn', () => {
      expect(motionVariants.fadeIn).toBeDefined();
      expect(motionVariants.fadeIn.hidden).toEqual({ opacity: 0 });
      expect(motionVariants.fadeIn.visible).toHaveProperty('opacity', 1);
      expect(motionVariants.fadeIn.visible.transition).toBeDefined();
      expect(motionVariants.fadeIn.exit).toHaveProperty('opacity', 0);
      expect(motionVariants.fadeIn.exit.transition).toBeDefined();
    });

    it('should have correct structure for slideUp', () => {
      expect(motionVariants.slideUp).toBeDefined();
      expect(motionVariants.slideUp.hidden).toEqual({ y: 20, opacity: 0 });
      expect(motionVariants.slideUp.visible).toHaveProperty('y', 0);
      expect(motionVariants.slideUp.visible).toHaveProperty('opacity', 1);
      expect(motionVariants.slideUp.exit).toHaveProperty('y', 20);
      expect(motionVariants.slideUp.exit).toHaveProperty('opacity', 0);
    });
  });

  describe('createStaggerChildren', () => {
    it('should return correct structure with default stagger time', () => {
      const staggerVariant = createStaggerChildren();
      expect(staggerVariant.hidden).toEqual({ opacity: 0 });
      expect(staggerVariant.visible).toHaveProperty('opacity', 1);
      expect(staggerVariant.visible.transition).toEqual({
        staggerChildren: 0.05,
        delayChildren: 0.1,
      });
    });

    it('should return correct structure with custom stagger time', () => {
      const staggerVariant = createStaggerChildren(0.1);
      expect(staggerVariant.visible.transition).toHaveProperty('staggerChildren', 0.1);
    });
  });

  describe('animationClasses', () => {
    it('should have correct structure for fadeIn', () => {
      expect(animationClasses.fadeIn).toBeDefined();
      expect(animationClasses.fadeIn.animation).toContain('0.5s ease forwards');
    });

    it('should have correct structure for pulse', () => {
      expect(animationClasses.pulse).toBeDefined();
      expect(animationClasses.pulse.animation).toContain('2s infinite ease-in-out');
    });
  });

  describe('staggered', () => {
    it('should return correct style object with default delay', () => {
      const staggeredStyle = staggered();
      expect(staggeredStyle.style).toBeDefined();
      expect(staggeredStyle.style.opacity).toBe(0);
      expect(staggeredStyle.style.animation).toContain('0.5s ease forwards 0s');
    });

    it('should return correct style object with custom delay', () => {
      const staggeredStyle = staggered(0.2);
      expect(staggeredStyle.style.animation).toContain('0.5s ease forwards 0.2s');
    });
  });

});