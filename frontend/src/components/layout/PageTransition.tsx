'use client';

import { motion, MotionProps } from 'framer-motion';
import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export function StaggerContainer({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: PageTransitionProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Table-safe versions that render as tbody/tr
export function StaggerTbody({ children }: { children: React.ReactNode }) {
  return (
    <motion.tbody initial="hidden" animate="show" variants={staggerContainerVariants}>
      {children}
    </motion.tbody>
  );
}

export function StaggerTr({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <motion.tr variants={staggerItemVariants} className={className} onClick={onClick}>
      {children}
    </motion.tr>
  );
}
