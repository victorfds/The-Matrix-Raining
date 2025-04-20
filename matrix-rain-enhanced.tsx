"use client"

import { useEffect, useState, useRef } from "react"

export default function MatrixRainEnhanced() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [drops, setDrops] = useState<
    Array<{
      x: number
      y: number
      speed: number
      speedCategory: "slow" | "medium" | "fast"
      chars: string[]
      changeFrequency: number
      glowIntensity: number
      fadeLength: number
    }>
  >([])

  // Characters used in the Matrix rain
  const matrixChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~"

  // Speed categories
  const SPEED_CATEGORIES = {
    slow: { min: 0.5, max: 1.0 },
    medium: { min: 1.2, max: 1.8 },
    fast: { min: 2.0, max: 2.5 },
  }

  // Initialize the rain drops
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current
        setDimensions({ width: offsetWidth, height: offsetHeight })

        // Calculate number of columns (one drop per 20px)
        const numColumns = Math.floor(offsetWidth / 20)

        // Create drops array with controlled randomness and distinct speed categories
        const newDrops = Array.from({ length: numColumns }, (_, i) => {
          const x = (i * offsetWidth) / numColumns + (Math.random() * 10 - 5) // Add slight x variation
          const y = -Math.random() * offsetHeight * 2 // Start at different positions above screen

          // Assign a speed category
          const speedCategory = (() => {
            const rand = Math.random()
            if (rand < 0.33) return "slow"
            if (rand < 0.66) return "medium"
            return "fast"
          })() as "slow" | "medium" | "fast"

          // Set speed based on category
          const { min, max } = SPEED_CATEGORIES[speedCategory]
          const speed = min + Math.random() * (max - min)

          const length = 5 + Math.floor(Math.random() * 25) // More varied lengths
          const changeFrequency = Math.random() * 0.15 // How often characters change (0-15% chance)
          const glowIntensity = 0.5 + Math.random() * 0.5 // Random glow effect intensity (higher minimum)
          const fadeLength = 0.2 + Math.random() * 0.3 // Fade effect length (20-50% of screen height)

          // Generate random characters for this drop
          const chars = Array.from({ length }, () => matrixChars[Math.floor(Math.random() * matrixChars.length)])

          return { x, y, speed, speedCategory, chars, changeFrequency, glowIntensity, fadeLength }
        })

        setDrops(newDrops)
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  // Animation loop
  useEffect(() => {
    if (drops.length === 0 || dimensions.height === 0) return

    let animationFrameId: number

    const animate = () => {
      setDrops((prevDrops) =>
        prevDrops.map((drop) => {
          // Move the drop down
          let newY = drop.y + drop.speed

          // Reset if it's off screen - make it smoother by only resetting when fully off screen
          if (newY > dimensions.height + drop.chars.length * 20) {
            // Completely off screen including all characters
            newY = -Math.random() * 500 - drop.chars.length * 20 // Random start position above screen

            // Occasionally change speed category when recycling
            const newSpeedCategory =
              Math.random() > 0.8
                ? drop.speedCategory
                : (["slow", "medium", "fast"][Math.floor(Math.random() * 3)] as "slow" | "medium" | "fast")

            // Set new speed based on category
            const { min, max } = SPEED_CATEGORIES[newSpeedCategory]
            const newSpeed = min + Math.random() * (max - min)

            return {
              ...drop,
              y: newY,
              speed: newSpeed,
              speedCategory: newSpeedCategory,
              // Occasionally change length when recycling
              chars:
                Math.random() > 0.8
                  ? drop.chars
                  : Array.from(
                      { length: 5 + Math.floor(Math.random() * 25) },
                      () => matrixChars[Math.floor(Math.random() * matrixChars.length)],
                    ),
              fadeLength: 0.2 + Math.random() * 0.3, // Randomize fade length when recycling
            }
          }

          // Randomly change some characters based on the column's change frequency
          const newChars = drop.chars.map((char) =>
            Math.random() < drop.changeFrequency ? matrixChars[Math.floor(Math.random() * matrixChars.length)] : char,
          )

          return { ...drop, y: newY, chars: newChars }
        }),
      )

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [drops, dimensions.height])

  return (
    <div ref={containerRef} className="w-full h-screen bg-black overflow-hidden relative">
      {drops.map((drop, dropIndex) => {
        // Calculate the fade effect based on position
        // If the column is near the bottom of the screen, apply fade
        const columnBottomY = drop.y + drop.chars.length * 20
        const fadeStartY = dimensions.height * (1 - drop.fadeLength)
        const fadeOpacity =
          columnBottomY > fadeStartY
            ? Math.max(0, 1 - (columnBottomY - fadeStartY) / (dimensions.height * drop.fadeLength))
            : 1

        return (
          <div
            key={dropIndex}
            className="absolute font-mono text-center"
            style={{
              left: `${drop.x}px`,
              top: `${drop.y}px`,
              opacity: fadeOpacity, // Apply fade effect to entire column
              transition: "top 0.1s linear", // Smooth movement
            }}
          >
            {drop.chars.map((char, charIndex) => {
              // Calculate opacity based on position in the stream
              // Characters at the top are more faded, bottom characters are more visible
              const charOpacity = 0.2 + (charIndex / drop.chars.length) * 0.8

              // Last character (bottom of column) is highlighted
              const isLastChar = charIndex === drop.chars.length - 1

              // Second-to-last and third-to-last characters get medium glow
              const isNearLastChar = charIndex >= drop.chars.length - 3 && charIndex < drop.chars.length - 1

              return (
                <div
                  key={charIndex}
                  className={`text-lg ${isLastChar ? "text-green-300" : "text-green-500"}`}
                  style={{
                    opacity: Math.min(1, charOpacity), // Ensure opacity doesn't exceed 1
                    textShadow: isLastChar
                      ? `0 0 ${8 * drop.glowIntensity}px #00FF41`
                      : isNearLastChar
                        ? `0 0 ${3 * drop.glowIntensity}px #008F11`
                        : "none",
                  }}
                >
                  {char}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
