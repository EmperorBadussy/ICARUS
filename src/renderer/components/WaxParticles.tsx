import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  opacityDir: number
  speed: number
  isEmber: boolean
  hue: number
}

export default function WaxParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Reduce particle count on small screens
      const targetCount = window.innerWidth < 768 ? 25 : 50
      const particles = particlesRef.current
      if (particles.length > targetCount) {
        particlesRef.current = particles.slice(0, targetCount)
      } else {
        while (particlesRef.current.length < targetCount) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -(0.3 + Math.random() * 0.8),
            radius: 2 + Math.random() * 4,
            opacity: 0.1 + Math.random() * 0.5,
            opacityDir: Math.random() > 0.5 ? 1 : -1,
            speed: 0.004 + Math.random() * 0.008,
            isEmber: Math.random() < 0.3,
            hue: 35 + Math.random() * 25
          })
        }
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const count = window.innerWidth < 768 ? 25 : 50
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.3 + Math.random() * 0.8),
      radius: 2 + Math.random() * 4,
      opacity: 0.1 + Math.random() * 0.5,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
      speed: 0.004 + Math.random() * 0.008,
      isEmber: Math.random() < 0.3,
      hue: 40 + Math.random() * 20
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const particles = particlesRef.current

      for (const p of particles) {
        // Move upward (like embers)
        p.x += p.vx
        p.y += p.vy

        // Wrap around
        if (p.y < -10) {
          p.y = canvas.height + 10
          p.x = Math.random() * canvas.width
        }
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1

        // Flicker
        p.opacity += p.opacityDir * p.speed
        if (p.opacity > 0.6) { p.opacity = 0.6; p.opacityDir = -1 }
        if (p.opacity < 0.1) { p.opacity = 0.1; p.opacityDir = 1 }

        ctx.save()
        ctx.shadowColor = `hsla(${p.hue}, 90%, 50%, ${p.opacity * 0.6})`
        ctx.shadowBlur = p.isEmber ? 12 : 6

        if (p.isEmber) {
          // Ember glow
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4)
          grad.addColorStop(0, `rgba(250, 204, 21, ${p.opacity})`)
          grad.addColorStop(0.4, `rgba(234, 179, 8, ${p.opacity * 0.5})`)
          grad.addColorStop(1, 'transparent')
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, 90%, 50%, ${p.opacity})`
          ctx.fill()
        }
        ctx.restore()
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
