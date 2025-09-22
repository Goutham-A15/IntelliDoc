"use client"

import { usePathname } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

/**
 * A client component that renders an animated background with a parallax effect
 * exclusively for the homepage.
 */
export function MotionBackground() {
  const pathname = usePathname()
  const containerRef = useRef(null)

  // Hooks for scroll-based animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  // Creates the parallax effect by moving the background image vertically
  // as the user scrolls down the page.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"])

  // Only render the background on the homepage
  if (pathname !== "/") {
    return null
  }

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
      {/* The moving background image */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url(/bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          y,
        }}
        // Add a subtle scale effect for more depth
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      {/* The semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/30 dark:bg-black/30" />
    </div>
  )
}
