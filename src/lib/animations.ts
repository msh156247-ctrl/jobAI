// 애니메이션 유틸리티 및 공통 트랜지션

// Framer Motion Variants
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const slideInFromLeft = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
}

export const slideInFromRight = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
}

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
}

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

// Transition presets
export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

export const easeTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
}

export const slowTransition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1],
}

// CSS Animation Classes (Tailwind)
export const transitionClasses = {
  default: 'transition-all duration-300 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  transform: 'transition-transform duration-300 ease-in-out',
  opacity: 'transition-opacity duration-300 ease-in-out',
}

// Hover effects
export const hoverScale = 'hover:scale-105 active:scale-95 transition-transform duration-200'
export const hoverLift = 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200'
export const hoverGlow = 'hover:shadow-xl transition-shadow duration-300'

// Loading animations
export const spinAnimation = 'animate-spin'
export const pulseAnimation = 'animate-pulse'
export const bounceAnimation = 'animate-bounce'

// Page transition helper
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

// Card animations
export const cardHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
}

// Button animations
export const buttonTap = {
  scale: 0.95,
}

// Modal animations
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
}

// Toast animations
export const toastVariants = {
  initial: { opacity: 0, y: -50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
}

// Skeleton loading
export const skeletonPulse = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]'

// Intersection Observer hook helper (for scroll animations)
export const useScrollAnimation = () => {
  return {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.5 },
  }
}

// List item stagger
export const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const listItem = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
}
