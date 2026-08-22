"use client";

import * as React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "../lib/utils";

const standardEase = [0.16, 1, 0.3, 1] as const;

export interface MotionStaggerContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
  delayChildren?: number;
}

export function MotionStaggerContainer({
  children,
  className,
  staggerDelay = 0.08, // 80ms stagger per Blueprint spec
  delayChildren = 0.05,
  ...props
}: MotionStaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : delayChildren,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

export interface MotionFadeRiseProps
  extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number;
}

export function MotionFadeRise({
  children,
  className,
  duration = 0.42, // 420ms duration
  ...props
}: MotionFadeRiseProps) {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 12,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : duration,
        ease: standardEase,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

export interface ErrorShakeProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger?: boolean | number | string;
}

export function ErrorShake({
  children,
  className,
  trigger,
  ...props
}: ErrorShakeProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      key={typeof trigger === "boolean" ? (trigger ? "error" : "idle") : trigger}
      animate={
        trigger
          ? shouldReduceMotion
            ? { opacity: [0.7, 1] }
            : { x: [0, -6, 6, -4, 4, 0] }
          : {}
      }
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className={cn("w-full", className)}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}
