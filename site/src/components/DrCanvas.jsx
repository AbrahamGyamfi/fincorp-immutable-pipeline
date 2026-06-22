import { useEffect, useRef } from 'react'

export default function DrCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const DPR = window.devicePixelRatio || 1

    let W = 0
    let H = 0
    let raf = null
    let dot_t = 0

    function setup() {
      W = canvas.parentElement.clientWidth
      H = Math.max(Math.min(Math.round(W * 0.28), 220), 160)
      canvas.width = W * DPR
      canvas.height = H * DPR
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.resetTransform()
      ctx.scale(DPR, DPR)
    }

    function qbez(t, ax, ay, bx, by, cx, cy) {
      const u = 1 - t
      return {
        x: u * u * ax + 2 * u * t * bx + t * t * cx,
        y: u * u * ay + 2 * u * t * by + t * t * cy,
      }
    }

    function drawNode(nx, ny, label, sub, role, color) {
      // glow
      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 42)
      ng.addColorStop(0, color + '22')
      ng.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(nx, ny, 42, 0, Math.PI * 2)
      ctx.fillStyle = ng
      ctx.fill()

      // circle
      ctx.beginPath()
      ctx.arc(nx, ny, 22, 0, Math.PI * 2)
      ctx.fillStyle = color + '18'
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()

      // inner dot
      ctx.beginPath()
      ctx.arc(nx, ny, 5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      // role badge
      ctx.save()
      ctx.font = 'bold 8.5px "Courier New", Courier, monospace'
      ctx.fillStyle = color
      ctx.textAlign = 'center'
      ctx.fillText('● ' + role, nx, ny - 33)
      ctx.restore()

      // region label
      ctx.save()
      ctx.font = 'bold 12px "Courier New", Courier, monospace'
      ctx.fillStyle = '#DDE8F0'
      ctx.textAlign = 'center'
      ctx.fillText(label, nx, ny + 38)
      ctx.restore()

      // sub label
      ctx.save()
      ctx.font = '10px "Courier New", Courier, monospace'
      ctx.fillStyle = '#7A96AA'
      ctx.textAlign = 'center'
      ctx.fillText(sub, nx, ny + 52)
      ctx.restore()
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      const n0x = W * 0.73, n0y = H * 0.54
      const n1x = W * 0.23, n1y = H * 0.54
      const cpx = W * 0.48, cpy = H * 0.12

      // Grid
      ctx.save()
      ctx.strokeStyle = 'rgba(58,124,165,0.07)'
      ctx.lineWidth = 1
      for (let gx = 0; gx <= W; gx += 44) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
      }
      for (let gy = 0; gy <= H; gy += 44) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
      }
      ctx.restore()

      // Arc
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(n0x, n0y)
      ctx.quadraticCurveTo(cpx, cpy, n1x, n1y)
      ctx.strokeStyle = 'rgba(58,124,165,0.28)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.restore()

      // Arc label
      const mid = qbez(0.5, n0x, n0y, cpx, cpy, n1x, n1y)
      ctx.save()
      ctx.font = '10px "Courier New", Courier, monospace'
      ctx.fillStyle = 'rgba(58,124,165,0.65)'
      ctx.textAlign = 'center'
      ctx.fillText('daily snapshot · cross-region copy', mid.x, mid.y - 10)
      ctx.restore()

      // Animated dot
      if (!REDUCE) {
        dot_t = (dot_t + 0.0025) % 1
        const dp = qbez(dot_t, n0x, n0y, cpx, cpy, n1x, n1y)

        const grd = ctx.createRadialGradient(dp.x, dp.y, 0, dp.x, dp.y, 18)
        grd.addColorStop(0, 'rgba(232,150,61,0.5)')
        grd.addColorStop(1, 'rgba(232,150,61,0)')
        ctx.beginPath()
        ctx.arc(dp.x, dp.y, 18, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        ctx.beginPath()
        ctx.arc(dp.x, dp.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#E8963D'
        ctx.fill()
      }

      drawNode(n0x, n0y, 'us-east-1', 'Primary · Multi-AZ RDS', 'PRIMARY', '#3A7CA5')
      drawNode(n1x, n1y, 'us-west-2', 'DR · Backup Vault',       'STANDBY', '#3A9970')

      if (!REDUCE) {
        raf = requestAnimationFrame(draw)
      }
    }

    setup()
    draw()

    let resizeTimer
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(raf)
        ctx.resetTransform()
        ctx.setLineDash([])
        setup()
        dot_t = 0
        draw()
      }, 80)
    }

    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div className="dr-canvas-wrap">
      <canvas
        ref={canvasRef}
        aria-label="Animated diagram: daily backup replication from us-east-1 (primary) to us-west-2 (DR)"
      />
    </div>
  )
}
