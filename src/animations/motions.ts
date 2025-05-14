import { keyframes } from '@emotion/react';

export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

export const slideInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

export const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
`;

export const motionVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  },

  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
      y: 20,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    }
  },

  slideLeft: {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
      x: -20,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    }
  },

  slideRight: {
    hidden: { x: 20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
      x: 20,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    }
  },

  scale: {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }
    },
    exit: {
      scale: 0.9,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
    }
  },

  stagger: {
    hidden: { opacity: 0 },
    visible: (i = 0) => ({
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  },

  listItem: {
    hidden: { opacity: 0, y: 10 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }),
    exit: {
      opacity: 0,
      y: 10,
      transition: { duration: 0.2 }
    }
  },

  buttonTap: {
    tap: { scale: 0.95 },
    hover: { scale: 1.05 }
  }
};

export const createStaggerChildren = (staggerTime = 0.05) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerTime,
      delayChildren: 0.1,
    }
  }
});


export const animationClasses = {
  fadeIn: {
    animation: `${fadeIn} 0.5s ease forwards`
  },
  slideInUp: {
    animation: `${slideInUp} 0.5s ease forwards`
  },
  slideInLeft: {
    animation: `${slideInLeft} 0.5s ease forwards`
  },
  slideInRight: {
    animation: `${slideInRight} 0.5s ease forwards`
  },
  scaleIn: {
    animation: `${scaleIn} 0.5s ease forwards`
  },
  pulse: {
    animation: `${pulse} 2s infinite ease-in-out`
  },
  float: {
    animation: `${float} 3s infinite ease-in-out`
  }
};

export const staggered = (delay: number = 0) => ({
  style: {
    opacity: 0,
    animation: `${fadeIn} 0.5s ease forwards ${delay}s`
  }
});