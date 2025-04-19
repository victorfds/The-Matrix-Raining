"use client"

import { useEffect, useState, useRef } from "react"

export default function MatrixRainEnhanced() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [drops, setDrops] = useState<
    Array<{ x: number; y: number; speed: number; chars: string[]; changeFrequency: number; glowIntensity: number }>
  >([])

  // Characters used in the Matrix rain
  const matrixChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]^~"

  // Initialize the rain drops
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current
        setDimensions({ width: offsetWidth, height: offsetHeight })

        // Calculate number of columns (one drop per 20px)
        const numColumns = Math.floor(offsetWidth / 20)

        // Create drops array with much more randomness
        const newDrops = Array.from({ length: numColumns }, (_, i) => {
          const x = (i * offsetWidth) / numColumns + (Math.random() * 10 - 5) // Add slight x variation
          const y = -Math.random() * offsetHeight * 2 // Start at different positions above screen
          const speed = 0.8 + Math.random() * 4.5 // Much wider range of speeds
          const length = 5 + Math.floor(Math.random() * 25) // More varied lengths
          const changeFrequency = Math.random() * 0.15 // How often characters change (0-15% chance)
          const glowIntensity = Math.random() // Random glow effect intensity

          // Generate random characters for this drop
          const chars = Array.from({ length }, () => matrixChars[Math.floor(Math.random() * matrixChars.length)])

          return { x, y, speed, chars, changeFrequency, glowIntensity }
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

            // Occasionally change speed when recycling
            const speed =
              Math.random() > 0.7
                ? drop.speed // 70% keep same speed
                : 0.8 + Math.random() * 4.5 // 30% get new random speed

            return {
              ...drop,
              y: newY,
              speed,
              // Occasionally change length when recycling
              chars:
                Math.random() > 0.8
                  ? drop.chars
                  : Array.from(
                      { length: 5 + Math.floor(Math.random() * 25) },
                      () => matrixChars[Math.floor(Math.random() * matrixChars.length)],
                    ),
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
      {drops.map((drop, dropIndex) => (
        <div
          key={dropIndex}
          className="absolute font-mono text-center"
          style={{
            left: `${drop.x}px`,
            top: `${drop.y}px`,
            transition: "top 0.1s linear", // Smooth movement
          }}
        >
          {drop.chars.map((char, charIndex) => {
            // Calculate opacity based on position in the stream
            const opacity = 1 - charIndex / drop.chars.length
            // First character is brightest
            const isFirstChar = charIndex === 0

            return (
              <div
                key={charIndex}
                className={`text-lg ${isFirstChar ? "text-green-300" : "text-green-500"}`}
                style={{
                  opacity: Math.max(0.2, opacity),
                  textShadow: isFirstChar
                    ? `0 0 ${8 * drop.glowIntensity}px #00FF41`
                    : charIndex < 3
                      ? `0 0 ${3 * drop.glowIntensity}px #008F11`
                      : "none",
                }}
              >
                {char}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
