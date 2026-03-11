// components/DrawingTools.tsx
'use client'

import React, { useEffect, useRef, useState, useCallback, memo } from 'react'
import { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import {
  MousePointer2, Minus, MoveHorizontal, MoveVertical, GitBranch,
  ArrowUpRight, TrendingUp, Triangle, Square, Circle, Type,
  Trash2, Undo2, Redo2, ChevronDown, ChevronRight, Eye, EyeOff,
  Lock, Unlock, Copy, X, Paintbrush, Crosshair, ZoomIn,
  ArrowUp, ArrowDown, Tag, MessageSquare, Ruler, LayoutGrid,
  Star, Zap, Target, Activity, BarChart2, Settings2, Download,
  AlignCenter, Minus as MinusIcon, Plus
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DrawingToolType =
  // Cursor & Erase
  | 'cursor' | 'eraser' | 'measure'
  // Lines
  | 'trend_line' | 'ray' | 'extended_line' | 'info_line'
  | 'horizontal_line' | 'horizontal_ray' | 'vertical_line' | 'cross_line'
  // Channels
  | 'parallel_channel' | 'regression_trend' | 'flat_top_channel'
  // Pitchfork
  | 'pitchfork' | 'schiff_pitchfork' | 'modified_schiff_pitchfork'
  // Fibonacci
  | 'fib_retracement' | 'fib_extension' | 'fib_fan' | 'fib_time_zones'
  | 'fib_speed_resistance' | 'fib_channel' | 'fib_wedge'
  // Gann
  | 'gann_fan' | 'gann_box' | 'gann_square'
  // Shapes
  | 'rectangle' | 'circle' | 'ellipse' | 'triangle_shape' | 'arc'
  | 'polyline' | 'brush'
  // Arrows
  | 'arrow_up' | 'arrow_down' | 'arrow_left' | 'arrow_right'
  | 'arrow_mark_up' | 'arrow_mark_down'
  // Annotations
  | 'text' | 'callout' | 'price_label' | 'note'
  | 'buy_signal' | 'sell_signal'
  // Patterns
  | 'elliott_wave' | 'xabcd_pattern' | 'head_shoulders'
  | 'cypher_pattern' | 'bat_pattern' | 'butterfly_pattern'
  // Other
  | 'long_position' | 'short_position' | 'price_range' | 'date_range'

export interface DrawingPoint {
  time: number        // unix timestamp
  price: number
  x?: number          // pixel (runtime)
  y?: number          // pixel (runtime)
}

export interface DrawingStyle {
  color: string
  lineWidth: number
  lineStyle: 'solid' | 'dashed' | 'dotted'
  fillColor?: string
  fillOpacity?: number
  fontSize?: number
  fontFamily?: string
  textColor?: string
  showLabels?: boolean
  showPrice?: boolean
  showDate?: boolean
  extendLeft?: boolean
  extendRight?: boolean
  fibLevels?: number[]
}

export interface Drawing {
  id: string
  type: DrawingToolType
  points: DrawingPoint[]
  style: DrawingStyle
  text?: string
  locked?: boolean
  hidden?: boolean
  selected?: boolean
  zIndex?: number
}

export interface DrawingActions {
  undo: () => void
  redo: () => void
  deleteSelected: () => void
  clearAll: () => void
}

export interface DrawingBarState {
  canUndo: boolean
  canRedo: boolean
  hasSelected: boolean
  drawingsCount: number
}

interface DrawingToolsProps {
  chartRef: React.MutableRefObject<IChartApi | null>
  seriesRef: React.MutableRefObject<ISeriesApi<any> | null>
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  enabled?: boolean
  panelOpen?: boolean
  onPanelClose?: () => void
  onDrawingsChange?: (drawings: Drawing[]) => void
  initialDrawings?: Drawing[]
  actionsRef?: React.MutableRefObject<DrawingActions | null>
  onStateChange?: (state: DrawingBarState) => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_STYLE: DrawingStyle = {
  color: '#f59e0b',
  lineWidth: 2,
  lineStyle: 'solid',
  fillColor: '#f59e0b',
  fillOpacity: 0.1,
  fontSize: 13,
  fontFamily: 'Inter, sans-serif',
  textColor: '#f1f5f9',
  showLabels: true,
  showPrice: true,
  showDate: false,
  extendLeft: false,
  extendRight: false,
  fibLevels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618],
}

const FIB_COLORS: Record<number, string> = {
  0:     '#ef4444',
  0.236: '#f97316',
  0.382: '#eab308',
  0.5:   '#84cc16',
  0.618: '#10b981',
  0.786: '#06b6d4',
  1:     '#3b82f6',
  1.272: '#8b5cf6',
  1.618: '#ec4899',
}

const GANN_FAN_LINES = [
  { ratio: 1/8, label: '1x8', color: '#ef4444' },
  { ratio: 1/4, label: '1x4', color: '#f97316' },
  { ratio: 1/3, label: '1x3', color: '#eab308' },
  { ratio: 1/2, label: '1x2', color: '#84cc16' },
  { ratio: 1/1, label: '1x1', color: '#10b981' },
  { ratio: 2/1, label: '2x1', color: '#06b6d4' },
  { ratio: 3/1, label: '3x1', color: '#3b82f6' },
  { ratio: 4/1, label: '4x1', color: '#8b5cf6' },
  { ratio: 8/1, label: '8x1', color: '#ec4899' },
]

// ─── Toolbar Config ───────────────────────────────────────────────────────────

const TOOL_GROUPS = [
  {
    label: 'Cursor',
    icon: MousePointer2,
    tools: [
      { id: 'cursor', label: 'Kursor', icon: MousePointer2 },
      { id: 'eraser', label: 'Hapus', icon: Trash2 },
    ]
  },
  {
    label: 'Garis',
    icon: Minus,
    tools: [
      { id: 'trend_line', label: 'Garis Tren', icon: TrendingUp },
      { id: 'horizontal_line', label: 'Garis Horizontal', icon: MoveHorizontal },
      { id: 'vertical_line', label: 'Garis Vertikal', icon: MoveVertical },
      { id: 'polyline', label: 'Polyline', icon: GitBranch },
    ]
  },
  {
    label: 'Channel',
    icon: LayoutGrid,
    tools: [
      { id: 'parallel_channel', label: 'Parallel Channel', icon: LayoutGrid },
      { id: 'pitchfork', label: "Andrew's Pitchfork", icon: GitBranch },
    ]
  },
  {
    label: 'Fibonacci',
    icon: Activity,
    tools: [
      { id: 'fib_retracement', label: 'Fibonacci Retracement', icon: Activity },
      { id: 'fib_extension', label: 'Fibonacci Extension', icon: Activity },
    ]
  },
  {
    label: 'Bentuk',
    icon: Square,
    tools: [
      { id: 'rectangle', label: 'Persegi', icon: Square },
      { id: 'circle', label: 'Lingkaran', icon: Circle },
      { id: 'triangle_shape', label: 'Segitiga', icon: Triangle },
    ]
  },
  {
    label: 'Anotasi',
    icon: Type,
    tools: [
      { id: 'text', label: 'Teks', icon: Type },
      { id: 'buy_signal', label: 'Buy Signal', icon: Zap },
      { id: 'sell_signal', label: 'Sell Signal', icon: Zap },
    ]
  },
]

// ─── Utility ─────────────────────────────────────────────────────────────────

function generateId() {
  return `draw_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

function setLineDash(ctx: CanvasRenderingContext2D, style: DrawingStyle['lineStyle']) {
  if (style === 'dashed') ctx.setLineDash([8, 4])
  else if (style === 'dotted') ctx.setLineDash([2, 4])
  else ctx.setLineDash([])
}

// ─── Hook: Coordinate Conversion ─────────────────────────────────────────────

function useChartCoords(
  chartRef: React.MutableRefObject<IChartApi | null>,
  seriesRef: React.MutableRefObject<ISeriesApi<any> | null>
) {
  const priceToY = useCallback((price: number): number | null => {
    if (!seriesRef.current) return null
    try { return seriesRef.current.priceToCoordinate(price) ?? null }
    catch { return null }
  }, [seriesRef])

  const yToPrice = useCallback((y: number): number | null => {
    if (!seriesRef.current) return null
    try { return seriesRef.current.coordinateToPrice(y) ?? null }
    catch { return null }
  }, [seriesRef])

  const timeToX = useCallback((time: number): number | null => {
    if (!chartRef.current) return null
    try {
      const x = chartRef.current.timeScale().timeToCoordinate(time as UTCTimestamp)
      return x ?? null
    }
    catch { return null }
  }, [chartRef])

  const xToTime = useCallback((x: number): number | null => {
    if (!chartRef.current) return null
    try {
      const t = chartRef.current.timeScale().coordinateToTime(x)
      return t ? (t as number) : null
    }
    catch { return null }
  }, [chartRef])

  const pointToPixel = useCallback((p: DrawingPoint): { x: number; y: number } | null => {
    const x = timeToX(p.time)
    const y = priceToY(p.price)
    if (x === null || y === null) return null
    return { x, y }
  }, [timeToX, priceToY])

  const pixelToPoint = useCallback((x: number, y: number): DrawingPoint | null => {
    const time = xToTime(x)
    const price = yToPrice(y)
    if (time === null || price === null) return null
    return { time, price, x, y }
  }, [xToTime, yToPrice])

  return { priceToY, yToPrice, timeToX, xToTime, pointToPixel, pixelToPoint }
}

// ─── Canvas Renderer ─────────────────────────────────────────────────────────

function renderDrawing(
  ctx: CanvasRenderingContext2D,
  drawing: Drawing,
  pixelPoints: Array<{ x: number; y: number }>,
  isSelected: boolean,
  canvasW: number,
  canvasH: number
) {
  if (pixelPoints.length === 0) return
  ctx.save()

  const s = drawing.style
  ctx.strokeStyle = s.color
  ctx.lineWidth = s.lineWidth
  setLineDash(ctx, s.lineStyle)
  ctx.globalAlpha = drawing.hidden ? 0.3 : 1

  const p0 = pixelPoints[0]
  const p1 = pixelPoints[1] ?? p0

  switch (drawing.type) {
    // ── Trend Line ──
    case 'trend_line': {
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p1.x, p1.y)
      ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Ray ──
    case 'ray': {
      const dx = p1.x - p0.x, dy = p1.y - p0.y
      const len = Math.max(canvasW, canvasH) * 2
      const angle = Math.atan2(dy, dx)
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p0.x + Math.cos(angle) * len, p0.y + Math.sin(angle) * len)
      ctx.stroke()
      renderEndpoints(ctx, [p0], s.color, isSelected)
      break
    }

    // ── Extended Line ──
    case 'extended_line': {
      if (p0.x === p1.x) {
        ctx.beginPath(); ctx.moveTo(p0.x, 0); ctx.lineTo(p0.x, canvasH); ctx.stroke()
      } else {
        const slope = (p1.y - p0.y) / (p1.x - p0.x)
        const yAtLeft = p0.y + slope * (0 - p0.x)
        const yAtRight = p0.y + slope * (canvasW - p0.x)
        ctx.beginPath()
        ctx.moveTo(0, yAtLeft)
        ctx.lineTo(canvasW, yAtRight)
        ctx.stroke()
      }
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Horizontal Line ──
    case 'horizontal_line': {
      ctx.beginPath()
      ctx.moveTo(0, p0.y)
      ctx.lineTo(canvasW, p0.y)
      ctx.stroke()
      if (s.showPrice) {
        renderPriceLabel(ctx, drawing.points[0].price, canvasW, p0.y, s.color)
      }
      break
    }

    // ── Horizontal Ray ──
    case 'horizontal_ray': {
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(canvasW, p0.y)
      ctx.stroke()
      break
    }

    // ── Vertical Line ──
    case 'vertical_line': {
      ctx.beginPath()
      ctx.moveTo(p0.x, 0)
      ctx.lineTo(p0.x, canvasH)
      ctx.stroke()
      break
    }

    // ── Cross Line ──
    case 'cross_line': {
      ctx.beginPath()
      ctx.moveTo(0, p0.y); ctx.lineTo(canvasW, p0.y)
      ctx.moveTo(p0.x, 0); ctx.lineTo(p0.x, canvasH)
      ctx.stroke()
      break
    }

    // ── Polyline ──
    case 'polyline': {
      if (pixelPoints.length < 2) break
      ctx.beginPath()
      ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y)
      for (let i = 1; i < pixelPoints.length; i++) {
        ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y)
      }
      ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Brush ──
    case 'brush': {
      if (pixelPoints.length < 2) break
      ctx.beginPath()
      ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y)
      for (let i = 1; i < pixelPoints.length; i++) {
        const xc = (pixelPoints[i].x + pixelPoints[i - 1].x) / 2
        const yc = (pixelPoints[i].y + pixelPoints[i - 1].y) / 2
        ctx.quadraticCurveTo(pixelPoints[i - 1].x, pixelPoints[i - 1].y, xc, yc)
      }
      ctx.stroke()
      break
    }

    // ── Parallel Channel ──
    case 'parallel_channel': {
      const p2 = pixelPoints[2] ?? { x: p1.x, y: p1.y + (p1.y - p0.y) }
      // Middle line
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke()
      // Parallel line
      const dy = p2.y - p0.y
      ctx.beginPath(); ctx.moveTo(p0.x + 0, p0.y + dy); ctx.lineTo(p1.x, p1.y + dy); ctx.stroke()
      // Fill
      if (s.fillColor) {
        ctx.globalAlpha = (s.fillOpacity ?? 0.1)
        ctx.fillStyle = s.fillColor
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y)
        ctx.lineTo(p1.x, p1.y + dy); ctx.lineTo(p0.x, p0.y + dy)
        ctx.closePath(); ctx.fill()
        ctx.globalAlpha = 1
      }
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Regression Trend ──
    case 'regression_trend': {
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke()
      // Deviation bands
      const devY = Math.abs(p1.y - p0.y) * 0.15
      ctx.setLineDash([4, 3])
      ctx.globalAlpha = 0.5
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y - devY); ctx.lineTo(p1.x, p1.y - devY); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y + devY); ctx.lineTo(p1.x, p1.y + devY); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Pitchfork ──
    case 'pitchfork':
    case 'schiff_pitchfork': {
      if (pixelPoints.length < 3) {
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke()
        break
      }
      const p2 = pixelPoints[2]
      // Median line: from p0 to midpoint of p1-p2
      const midX = (p1.x + p2.x) / 2
      const midY = (p1.y + p2.y) / 2
      const ext = 3
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(midX + (midX - p0.x) * ext, midY + (midY - p0.y) * ext)
      ctx.stroke()
      // Left and right lines
      const dxR = (midX - p0.x) * ext
      const dyR = (midY - p0.y) * ext
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p1.x + dxR, p1.y + dyR)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(p2.x, p2.y)
      ctx.lineTo(p2.x + dxR, p2.y + dyR)
      ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Fibonacci Retracement ──
    case 'fib_retracement': {
      const levels = s.fibLevels ?? DEFAULT_STYLE.fibLevels!
      const dy = p1.y - p0.y
      ctx.setLineDash([])
      levels.forEach(level => {
        const y = p0.y + dy * level
        const col = FIB_COLORS[level] ?? s.color
        ctx.strokeStyle = col
        ctx.globalAlpha = 0.8
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke()
        if (s.showLabels) {
          ctx.globalAlpha = 1
          ctx.font = `${s.fontSize ?? 11}px ${s.fontFamily ?? 'sans-serif'}`
          ctx.fillStyle = col
          ctx.fillText(`${(level * 100).toFixed(1)}%`, canvasW - 60, y - 3)
          ctx.fillStyle = s.textColor ?? '#f1f5f9'
          const price = drawing.points[0].price + (drawing.points[1].price - drawing.points[0].price) * level
          ctx.fillText(price.toPrecision(6), canvasW - 120, y - 3)
        }
      })
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Fibonacci Extension ──
    case 'fib_extension': {
      const extLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618, 2.0, 2.618]
      const dy2 = p1.y - p0.y
      extLevels.forEach(level => {
        const y = p1.y + dy2 * level
        const col = FIB_COLORS[level] ?? s.color
        ctx.strokeStyle = col; ctx.globalAlpha = 0.7
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke()
        if (s.showLabels) {
          ctx.globalAlpha = 1; ctx.fillStyle = col
          ctx.font = `11px sans-serif`
          ctx.fillText(`${(level * 100).toFixed(1)}%`, canvasW - 55, y - 3)
        }
      })
      ctx.setLineDash([])
      ctx.strokeStyle = s.color; ctx.globalAlpha = 1
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Fibonacci Fan ──
    case 'fib_fan': {
      const fanLevels = [0.236, 0.382, 0.5, 0.618, 0.786]
      const fanLen = canvasW * 2
      fanLevels.forEach(level => {
        const targetY = p0.y + (p1.y - p0.y) * level
        const angle = Math.atan2(targetY - p0.y, p1.x - p0.x)
        const col = FIB_COLORS[level] ?? s.color
        ctx.strokeStyle = col; ctx.globalAlpha = 0.8
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p0.x + Math.cos(angle) * fanLen, p0.y + Math.sin(angle) * fanLen)
        ctx.stroke()
        if (s.showLabels) {
          ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.font = '11px sans-serif'
          ctx.fillText(`${(level * 100).toFixed(1)}%`, p0.x + 50, p0.y + Math.sin(angle) * 50 - 3)
        }
      })
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Fibonacci Time Zones ──
    case 'fib_time_zones': {
      const timeDx = p1.x - p0.x
      const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55]
      fibs.forEach(n => {
        const x = p0.x + timeDx * n
        if (x < 0 || x > canvasW) return
        ctx.strokeStyle = s.color; ctx.globalAlpha = 0.5
        ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke()
        ctx.globalAlpha = 1; ctx.fillStyle = s.color; ctx.font = '10px sans-serif'
        ctx.fillText(String(n), x + 2, 16)
      })
      break
    }

    // ── Fibonacci Speed Resistance ──
    case 'fib_speed_resistance': {
      const levels2 = [0.25, 0.333, 0.5, 0.667, 0.75, 1]
      const dx2 = p1.x - p0.x, dy3 = p1.y - p0.y
      levels2.forEach(level => {
        ctx.strokeStyle = s.color; ctx.globalAlpha = 0.6
        ctx.setLineDash([4, 3])
        // Horizontal
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y + dy3 * level); ctx.lineTo(p1.x, p0.y + dy3 * level); ctx.stroke()
        // Vertical
        ctx.beginPath(); ctx.moveTo(p0.x + dx2 * level, p0.y); ctx.lineTo(p0.x + dx2 * level, p1.y); ctx.stroke()
      })
      // Diagonals
      ctx.setLineDash([])
      ctx.strokeStyle = s.color; ctx.globalAlpha = 0.9
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(p0.x, p1.y); ctx.lineTo(p1.x, p0.y); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Fibonacci Channel ──
    case 'fib_channel': {
      const channelDy = p1.y - p0.y
      const fibChLevels = [0, 0.382, 0.618, 1, 1.618, 2.618]
      fibChLevels.forEach(level => {
        const y = p0.y + channelDy * level
        const col = FIB_COLORS[level] ?? s.color
        ctx.strokeStyle = col; ctx.globalAlpha = 0.7
        ctx.beginPath(); ctx.moveTo(p0.x, y); ctx.lineTo(p1.x, y); ctx.stroke()
      })
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Gann Fan ──
    case 'gann_fan': {
      GANN_FAN_LINES.forEach(line => {
        const slope = line.ratio
        const len = canvasW * 2
        ctx.strokeStyle = line.color
        ctx.globalAlpha = 0.75
        ctx.setLineDash([])
        // Upward
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p0.x + len, p0.y - len * slope)
        ctx.stroke()
        // Downward
        ctx.beginPath()
        ctx.moveTo(p0.x, p0.y)
        ctx.lineTo(p0.x + len, p0.y + len * slope)
        ctx.stroke()
        if (s.showLabels) {
          ctx.globalAlpha = 1; ctx.fillStyle = line.color; ctx.font = '10px sans-serif'
          ctx.fillText(line.label, p0.x + 60, p0.y - len * slope * 0.5 - 3)
        }
      })
      renderEndpoints(ctx, [p0], s.color, isSelected)
      break
    }

    // ── Gann Box ──
    case 'gann_box': {
      const gX = Math.min(p0.x, p1.x), gY = Math.min(p0.y, p1.y)
      const gW = Math.abs(p1.x - p0.x), gH = Math.abs(p1.y - p0.y)
      const squares = [0.25, 0.5, 0.75, 1]
      squares.forEach(s2 => {
        ctx.strokeStyle = s.color; ctx.globalAlpha = s2 * 0.7
        ctx.beginPath()
        ctx.rect(gX + gW * (1 - s2) / 2, gY + gH * (1 - s2) / 2, gW * s2, gH * s2)
        ctx.stroke()
      })
      // Diagonals
      ctx.globalAlpha = 0.5; ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(p0.x, p1.y); ctx.lineTo(p1.x, p0.y); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Rectangle ──
    case 'rectangle': {
      const rX = Math.min(p0.x, p1.x), rY = Math.min(p0.y, p1.y)
      const rW = Math.abs(p1.x - p0.x), rH = Math.abs(p1.y - p0.y)
      if (s.fillColor) {
        ctx.fillStyle = s.fillColor
        ctx.globalAlpha = s.fillOpacity ?? 0.1
        ctx.fillRect(rX, rY, rW, rH)
        ctx.globalAlpha = 1
      }
      ctx.beginPath(); ctx.rect(rX, rY, rW, rH); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Circle ──
    case 'circle': {
      const r = Math.hypot(p1.x - p0.x, p1.y - p0.y)
      if (s.fillColor) {
        ctx.fillStyle = s.fillColor; ctx.globalAlpha = s.fillOpacity ?? 0.1
        ctx.beginPath(); ctx.arc(p0.x, p0.y, r, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      }
      ctx.beginPath(); ctx.arc(p0.x, p0.y, r, 0, Math.PI * 2); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Ellipse ──
    case 'ellipse': {
      const rx = Math.abs(p1.x - p0.x), ry = Math.abs(p1.y - p0.y)
      if (s.fillColor) {
        ctx.fillStyle = s.fillColor; ctx.globalAlpha = s.fillOpacity ?? 0.1
        ctx.beginPath(); ctx.ellipse(p0.x, p0.y, rx, ry, 0, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      }
      ctx.beginPath(); ctx.ellipse(p0.x, p0.y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Triangle Shape ──
    case 'triangle_shape': {
      const p2t = pixelPoints[2] ?? { x: p0.x + (p1.x - p0.x) / 2, y: p0.y }
      if (s.fillColor) {
        ctx.fillStyle = s.fillColor; ctx.globalAlpha = s.fillOpacity ?? 0.1
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2t.x, p2t.y); ctx.closePath(); ctx.fill()
        ctx.globalAlpha = 1
      }
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2t.x, p2t.y); ctx.closePath(); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Arc ──
    case 'arc': {
      const r2 = Math.hypot(p1.x - p0.x, p1.y - p0.y)
      ctx.beginPath(); ctx.arc(p0.x, p0.y, r2, -Math.PI, 0); ctx.stroke()
      renderEndpoints(ctx, pixelPoints, s.color, isSelected)
      break
    }

    // ── Arrow Up / Down ──
    case 'arrow_up':
    case 'arrow_mark_up': {
      drawArrow(ctx, p0.x, p0.y, s.color, 'up', drawing.type === 'arrow_mark_up' ? 16 : 24)
      break
    }
    case 'arrow_down':
    case 'arrow_mark_down': {
      drawArrow(ctx, p0.x, p0.y, s.color, 'down', drawing.type === 'arrow_mark_down' ? 16 : 24)
      break
    }

    // ── Text ──
    case 'text':
    case 'note': {
      ctx.font = `bold ${s.fontSize ?? 14}px ${s.fontFamily ?? 'sans-serif'}`
      ctx.fillStyle = s.textColor ?? '#f1f5f9'
      ctx.fillText(drawing.text || 'Text', p0.x, p0.y)
      if (isSelected) {
        const m = ctx.measureText(drawing.text || 'Text')
        ctx.strokeStyle = s.color; ctx.setLineDash([3, 3])
        ctx.strokeRect(p0.x - 2, p0.y - (s.fontSize ?? 14) - 2, m.width + 4, (s.fontSize ?? 14) + 6)
      }
      break
    }

    // ── Callout ──
    case 'callout': {
      const txt = drawing.text || 'Note'
      const pad = 8, boxW = Math.max(120, txt.length * 8) + pad * 2, boxH = 32
      const bx = p0.x, by = p0.y - 50
      // Box
      ctx.fillStyle = s.fillColor ?? '#1e293b'
      ctx.globalAlpha = 0.9
      roundRect(ctx, bx, by, boxW, boxH, 6)
      ctx.fill(); ctx.globalAlpha = 1
      ctx.strokeStyle = s.color; ctx.setLineDash([])
      roundRect(ctx, bx, by, boxW, boxH, 6); ctx.stroke()
      // Tail
      ctx.beginPath(); ctx.moveTo(bx + 16, by + boxH); ctx.lineTo(p0.x, p0.y); ctx.lineTo(bx + 26, by + boxH); ctx.stroke()
      // Text
      ctx.fillStyle = s.textColor ?? '#f1f5f9'; ctx.font = `${s.fontSize ?? 12}px sans-serif`
      ctx.fillText(txt, bx + pad, by + boxH / 2 + 4)
      break
    }

    // ── Price Label ──
    case 'price_label': {
      const pl = drawing.text || drawing.points[0].price.toPrecision(6)
      ctx.fillStyle = s.color; ctx.globalAlpha = 0.9
      ctx.fillRect(p0.x, p0.y - 12, pl.length * 7 + 8, 18)
      ctx.globalAlpha = 1
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'
      ctx.fillText(pl, p0.x + 4, p0.y)
      // Line to right
      ctx.strokeStyle = s.color
      ctx.beginPath(); ctx.moveTo(0, p0.y); ctx.lineTo(p0.x, p0.y); ctx.stroke()
      break
    }

    // ── Buy/Sell Signal ──
    case 'buy_signal': {
      // Green upward flag
      ctx.fillStyle = '#10b981'; ctx.strokeStyle = '#10b981'
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p0.x - 8, p0.y - 20)
      ctx.lineTo(p0.x + 8, p0.y - 20)
      ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p0.x, p0.y - 30); ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'
      ctx.fillText('B', p0.x - 4, p0.y - 13)
      break
    }
    case 'sell_signal': {
      ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(p0.x, p0.y)
      ctx.lineTo(p0.x - 8, p0.y + 20)
      ctx.lineTo(p0.x + 8, p0.y + 20)
      ctx.closePath(); ctx.fill()
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p0.x, p0.y + 30); ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'
      ctx.fillText('S', p0.x - 4, p0.y + 22)
      break
    }

    // ── Long/Short Position ──
    case 'long_position': {
      const lpH = Math.abs(p1.y - p0.y)
      ctx.fillStyle = 'rgba(16,185,129,0.15)'; ctx.strokeStyle = '#10b981'
      ctx.fillRect(p0.x, Math.min(p0.y, p1.y), p1.x - p0.x, lpH); 
      ctx.strokeRect(p0.x, Math.min(p0.y, p1.y), p1.x - p0.x, lpH)
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#10b981'
      ctx.fillText('LONG', p0.x + 6, Math.min(p0.y, p1.y) + 16)
      renderEndpoints(ctx, pixelPoints, '#10b981', isSelected)
      break
    }
    case 'short_position': {
      const spH = Math.abs(p1.y - p0.y)
      ctx.fillStyle = 'rgba(239,68,68,0.15)'; ctx.strokeStyle = '#ef4444'
      ctx.fillRect(p0.x, Math.min(p0.y, p1.y), p1.x - p0.x, spH)
      ctx.strokeRect(p0.x, Math.min(p0.y, p1.y), p1.x - p0.x, spH)
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#ef4444'
      ctx.fillText('SHORT', p0.x + 6, Math.min(p0.y, p1.y) + 16)
      renderEndpoints(ctx, pixelPoints, '#ef4444', isSelected)
      break
    }

    // ── Elliott Wave ──
    case 'elliott_wave': {
      if (pixelPoints.length < 2) { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); break }
      ctx.beginPath(); ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y)
      for (let i = 1; i < pixelPoints.length; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y)
      ctx.stroke()
      const waveLabels = ['1', '2', '3', '4', '5', 'A', 'B', 'C']
      pixelPoints.forEach((pp, i) => {
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = s.color; ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'
        ctx.fillText(waveLabels[i] ?? String(i + 1), pp.x - 3, pp.y - 10)
      })
      break
    }

    // ── XABCD Pattern ──
    case 'xabcd_pattern': {
      const labels = ['X', 'A', 'B', 'C', 'D']
      if (pixelPoints.length < 2) break
      ctx.beginPath(); ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y)
      for (let i = 1; i < pixelPoints.length; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y)
      ctx.stroke()
      pixelPoints.forEach((pp, i) => {
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#f59e0b'; ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'
        ctx.fillText(labels[i] ?? '', pp.x - 4, pp.y - 10)
      })
      break
    }

    // ── Measure ──
    case 'price_range':
    case 'measure': {
      const mX1 = Math.min(p0.x, p1.x), mX2 = Math.max(p0.x, p1.x)
      const mY1 = Math.min(p0.y, p1.y), mY2 = Math.max(p0.y, p1.y)
      ctx.fillStyle = 'rgba(59,130,246,0.12)'
      ctx.fillRect(mX1, mY1, mX2 - mX1, mY2 - mY1)
      ctx.strokeStyle = '#3b82f6'; ctx.setLineDash([4, 3])
      ctx.strokeRect(mX1, mY1, mX2 - mX1, mY2 - mY1)
      const priceDiff = Math.abs(drawing.points[1].price - drawing.points[0].price)
      const pct = drawing.points[0].price > 0 ? ((priceDiff / drawing.points[0].price) * 100).toFixed(2) : '0'
      ctx.fillStyle = '#60a5fa'; ctx.font = 'bold 11px sans-serif'; ctx.setLineDash([])
      ctx.fillText(`Δ ${pct}%`, mX1 + 4, mY1 + 16)
      ctx.fillText(`Δ ${priceDiff.toPrecision(5)}`, mX1 + 4, mY1 + 30)
      break
    }

    default: {
      // Generic two-point line fallback
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke()
    }
  }

  // Selection highlight
  if (isSelected) {
    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = drawing.style.lineWidth + 2
    ctx.globalAlpha = 0.3
    ctx.setLineDash([4, 2])
    // Just re-outline loosely for hit feedback
    pixelPoints.slice(0, 2).forEach((pp, i) => {
      if (i === 0) { ctx.beginPath(); ctx.moveTo(pp.x, pp.y) }
      else ctx.lineTo(pp.x, pp.y)
    })
    ctx.stroke()
  }

  ctx.restore()
}

function renderEndpoints(
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  isSelected: boolean
) {
  if (!isSelected) return
  points.forEach(p => {
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = color; ctx.fill()
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5
    ctx.stroke()
  })
}

function renderPriceLabel(
  ctx: CanvasRenderingContext2D,
  price: number,
  canvasW: number,
  y: number,
  color: string
) {
  const label = price.toPrecision(6)
  const w = label.length * 7 + 8
  ctx.fillStyle = color; ctx.globalAlpha = 0.85
  ctx.fillRect(canvasW - w - 4, y - 9, w, 16)
  ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'
  ctx.fillText(label, canvasW - w, y + 3)
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string,
  dir: 'up' | 'down',
  size: number
) {
  ctx.fillStyle = color; ctx.strokeStyle = color
  const s = size, hs = s / 2
  ctx.beginPath()
  if (dir === 'up') {
    ctx.moveTo(x, y - s)
    ctx.lineTo(x - hs, y)
    ctx.lineTo(x - hs * 0.4, y)
    ctx.lineTo(x - hs * 0.4, y + hs)
    ctx.lineTo(x + hs * 0.4, y + hs)
    ctx.lineTo(x + hs * 0.4, y)
    ctx.lineTo(x + hs, y)
  } else {
    ctx.moveTo(x, y + s)
    ctx.lineTo(x - hs, y)
    ctx.lineTo(x - hs * 0.4, y)
    ctx.lineTo(x - hs * 0.4, y - hs)
    ctx.lineTo(x + hs * 0.4, y - hs)
    ctx.lineTo(x + hs * 0.4, y)
    ctx.lineTo(x + hs, y)
  }
  ctx.closePath(); ctx.fill()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ─── Hit Test ────────────────────────────────────────────────────────────────

function hitTest(drawing: Drawing, px: number, py: number, pixelPoints: Array<{ x: number; y: number }>, threshold = 10): boolean {
  if (pixelPoints.length === 0) return false
  const p0 = pixelPoints[0], p1 = pixelPoints[1] ?? p0

  switch (drawing.type) {
    case 'horizontal_line':
      return Math.abs(py - p0.y) < threshold
    case 'vertical_line':
      return Math.abs(px - p0.x) < threshold
    case 'cross_line':
      return Math.abs(py - p0.y) < threshold || Math.abs(px - p0.x) < threshold
    case 'rectangle':
    case 'long_position':
    case 'short_position':
    case 'measure':
    case 'price_range': {
      const minX = Math.min(p0.x, p1.x), maxX = Math.max(p0.x, p1.x)
      const minY = Math.min(p0.y, p1.y), maxY = Math.max(p0.y, p1.y)
      return px >= minX - threshold && px <= maxX + threshold && py >= minY - threshold && py <= maxY + threshold
    }
    case 'circle': {
      const r = Math.hypot(p1.x - p0.x, p1.y - p0.y)
      const dist = Math.hypot(px - p0.x, py - p0.y)
      return Math.abs(dist - r) < threshold
    }
    case 'text':
    case 'note':
    case 'price_label':
    case 'buy_signal':
    case 'sell_signal':
    case 'arrow_up':
    case 'arrow_down':
    case 'arrow_mark_up':
    case 'arrow_mark_down':
      return Math.hypot(px - p0.x, py - p0.y) < 24
    default:
      for (let i = 0; i < pixelPoints.length - 1; i++) {
        if (distToSegment(px, py, pixelPoints[i].x, pixelPoints[i].y, pixelPoints[i + 1].x, pixelPoints[i + 1].y) < threshold) return true
      }
      return false
  }
}

// ─── Points needed per tool ───────────────────────────────────────────────────

const REQUIRED_POINTS: Partial<Record<DrawingToolType, number>> = {
  horizontal_line: 1, vertical_line: 1, cross_line: 1,
  horizontal_ray: 1, arrow_up: 1, arrow_down: 1,
  arrow_mark_up: 1, arrow_mark_down: 1,
  buy_signal: 1, sell_signal: 1,
  text: 1, note: 1, price_label: 1,
  gann_fan: 1,
  pitchfork: 3, schiff_pitchfork: 3, modified_schiff_pitchfork: 3, triangle_shape: 3,
  fib_time_zones: 2,
}
function getRequiredPoints(tool: DrawingToolType): number {
  if (REQUIRED_POINTS[tool] !== undefined) return REQUIRED_POINTS[tool]!
  return 2
}

const MULTI_POINT_TOOLS: Set<DrawingToolType> = new Set([
  'polyline', 'brush', 'elliott_wave', 'xabcd_pattern'
])

// ─── Style Panel ──────────────────────────────────────────────────────────────

const StylePanel = memo(({ style, onChange }: {
  style: DrawingStyle
  onChange: (s: DrawingStyle) => void
}) => {
  const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#fff', '#94a3b8']
  return (
    <div className="p-3 space-y-3">
      <div>
        <div className="text-[10px] text-gray-400 mb-1.5 font-semibold tracking-wider">WARNA</div>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map(c => (
            <button key={c}
              className={`w-5 h-5 rounded-sm transition-all ${style.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
              style={{ background: c }}
              onClick={() => onChange({ ...style, color: c, fillColor: c })}
            />
          ))}
          <input type="color" value={style.color}
            onChange={e => onChange({ ...style, color: e.target.value, fillColor: e.target.value })}
            className="w-5 h-5 rounded cursor-pointer border-0" title="Custom color"
          />
        </div>
      </div>

      <div>
        <div className="text-[10px] text-gray-400 mb-1.5 font-semibold tracking-wider">KETEBALAN</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(w => (
            <button key={w}
              className={`px-2.5 py-1 text-xs rounded transition-all ${style.lineWidth === w ? 'bg-blue-500 text-white' : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'}`}
              onClick={() => onChange({ ...style, lineWidth: w })}
            >{w}px</button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] text-gray-400 mb-1.5 font-semibold tracking-wider">GAYA GARIS</div>
        <div className="flex gap-1">
          {(['solid', 'dashed', 'dotted'] as const).map(ls => (
            <button key={ls}
              className={`px-2.5 py-1 text-xs rounded capitalize transition-all ${style.lineStyle === ls ? 'bg-blue-500 text-white' : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'}`}
              onClick={() => onChange({ ...style, lineStyle: ls })}
            >{ls === 'solid' ? '—' : ls === 'dashed' ? '- -' : '···'}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={style.showLabels ?? true}
            onChange={e => onChange({ ...style, showLabels: e.target.checked })}
            className="w-3.5 h-3.5 accent-blue-500" />
          <span className="text-xs text-gray-300">Tampilkan Label</span>
        </label>
      </div>
    </div>
  )
})
StylePanel.displayName = 'StylePanel'

// ─── Text Input Modal ─────────────────────────────────────────────────────────

const TextInputModal = memo(({ onConfirm, onCancel }: {
  onConfirm: (text: string) => void
  onCancel: () => void
}) => {
  const [value, setValue] = useState('Label')
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0f1419] border border-gray-700/50 rounded-xl p-5 w-72 shadow-2xl">
        <div className="text-sm font-semibold text-white mb-3">Masukkan Teks</div>
        <input autoFocus value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm(value); if (e.key === 'Escape') onCancel() }}
          className="w-full bg-[#1a1f2e] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
        <div className="flex gap-2 mt-3">
          <button onClick={() => onConfirm(value)} className="flex-1 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm text-white font-medium transition-colors">OK</button>
          <button onClick={onCancel} className="flex-1 py-1.5 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg text-sm text-gray-300 transition-colors">Batal</button>
        </div>
      </div>
    </div>
  )
})
TextInputModal.displayName = 'TextInputModal'

// ─── Main Component ───────────────────────────────────────────────────────────

const DrawingTools = memo(({
  chartRef,
  seriesRef,
  containerRef,
  enabled = true,
  panelOpen,
  onPanelClose,
  onDrawingsChange,
  initialDrawings = [],
  actionsRef,
  onStateChange,
}: DrawingToolsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeTool, setActiveTool] = useState<DrawingToolType>('cursor')
  const [drawings, setDrawings] = useState<Drawing[]>(initialDrawings)
  const [history, setHistory] = useState<Drawing[][]>([initialDrawings])
  const [historyIdx, setHistoryIdx] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [currentStyle, setCurrentStyle] = useState<DrawingStyle>({ ...DEFAULT_STYLE })
  const [showStylePanel, setShowStylePanel] = useState(false)
  const [showToolbar, setShowToolbar] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Garis')
  const [searchQuery, setSearchQuery] = useState('')

  // Sync showToolbar with external panelOpen prop
  useEffect(() => {
    if (panelOpen !== undefined) {
      setShowToolbar(panelOpen)
      // Saat panel ditutup via icon, matikan mode gambar sekalian
      if (!panelOpen) {
        setActiveTool('cursor')
        setIsDrawing(false)
        setActiveDrawingId(null)
      }
    }
  }, [panelOpen])

  // ── Disable chart scroll/scale only when actively drawing (not in cursor mode) ──
  useEffect(() => {
    if (!chartRef.current) return
    const isDrawingMode = activeTool !== 'cursor'
    chartRef.current.applyOptions({
      handleScroll: !isDrawingMode,
      handleScale: !isDrawingMode,
    })
    return () => {
      try { chartRef.current?.applyOptions({ handleScroll: true, handleScale: true }) } catch {}
    }
  }, [activeTool, chartRef])

  // ── Forward a mouse event directly to the chart's internal canvas ──
  // lightweight-charts attaches listeners to its own <canvas> child, not the container div.
  // Dispatching to the container with bubbles:true goes UP the DOM, not down to children.
  // We must target the chart canvas directly.
  const forwardToChart = useCallback((e: React.MouseEvent<HTMLCanvasElement>, type: string) => {
    const container = containerRef.current
    if (!container) return
    // Find the chart's own canvas (first canvas inside container that is NOT our drawing canvas)
    const ourCanvas = canvasRef.current
    const chartCanvas = Array.from(container.querySelectorAll('canvas')).find(c => c !== ourCanvas) as HTMLCanvasElement | null
    const target = chartCanvas ?? container
    target.dispatchEvent(new MouseEvent(type, {
      bubbles: true, cancelable: true,
      clientX: e.clientX, clientY: e.clientY,
      button: e.button, buttons: e.buttons,
      ctrlKey: e.ctrlKey, shiftKey: e.shiftKey,
      altKey: e.altKey, metaKey: e.metaKey,
      movementX: e.movementX, movementY: e.movementY,
    }))
  }, [containerRef])

  // Track whether the cursor is hovering over a drawing (for cursor style)
  const [isHoveringDrawing, setIsHoveringDrawing] = useState(false)
  // Position (in canvas CSS px) where a drawing was last clicked — used to anchor floating toolbar
  const [selectedPos, setSelectedPos] = useState<{ x: number; y: number } | null>(null)
  const [showTextModal, setShowTextModal] = useState(false)
  const [pendingTextPoint, setPendingTextPoint] = useState<DrawingPoint | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const brushPointsRef = useRef<DrawingPoint[]>([])

  const { pointToPixel, pixelToPoint, priceToY, timeToX } = useChartCoords(chartRef, seriesRef)

  // ── Push undo history ──
  const pushHistory = useCallback((newDrawings: Drawing[]) => {
    setHistory(h => {
      const trimmed = h.slice(0, historyIdx + 1)
      const next = [...trimmed, newDrawings]
      setHistoryIdx(next.length - 1)
      return next.slice(-50)
    })
    onDrawingsChange?.(newDrawings)
  }, [historyIdx, onDrawingsChange])

  const setDrawingsAndHistory = useCallback((d: Drawing[]) => {
    setDrawings(d); pushHistory(d)
  }, [pushHistory])

  const undo = useCallback(() => {
    if (historyIdx <= 0) return
    const prev = history[historyIdx - 1]
    setDrawings(prev); setHistoryIdx(hi => hi - 1)
  }, [history, historyIdx])

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const next = history[historyIdx + 1]
    setDrawings(next); setHistoryIdx(hi => hi + 1)
  }, [history, historyIdx])

  // ── Render canvas ──
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Clear using CSS pixel dimensions (context is already scaled by DPR)
    const cssW = canvas.getBoundingClientRect().width || canvas.width
    const cssH = canvas.getBoundingClientRect().height || canvas.height
    ctx.clearRect(0, 0, cssW, cssH)

    for (const d of drawings) {
      const pxPoints: Array<{ x: number; y: number }> = []
      for (const pt of d.points) {
        const pp = pointToPixel(pt)
        if (pp) pxPoints.push(pp)
      }
      renderDrawing(ctx, d, pxPoints, d.id === selectedId, cssW, cssH)
    }

    // Preview cursor crosshair for current tool
    if (activeTool !== 'cursor' && activeTool !== 'eraser' && cursorPos) {
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(cursorPos.x, 0); ctx.lineTo(cursorPos.x, cssH); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, cursorPos.y); ctx.lineTo(cssW, cursorPos.y); ctx.stroke()
      ctx.restore()
    }
  }, [drawings, pointToPixel, selectedId, activeTool, cursorPos])

  // Re-render on every chart update
  useEffect(() => {
    render()
    const id = requestAnimationFrame(render)
    return () => cancelAnimationFrame(id)
  })

  // ── Resize canvas — mirror exactly the chart container dimensions ──
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const syncSize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (width === 0 || height === 0) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      // Reset and apply DPR scale so all drawing uses CSS pixel coords
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }

    syncSize()
    const ro = new ResizeObserver(syncSize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [containerRef, enabled])

  // ── Mouse helpers ──
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    // Return CSS pixel coordinates (what lightweight-charts coordinateToTime expects)
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const getCursor = useCallback(() => {
    if (activeTool === 'cursor') return isDragging ? 'grabbing' : 'default'
    if (activeTool === 'eraser') return 'cell'
    if (activeTool === 'text' || activeTool === 'callout' || activeTool === 'note') return 'text'
    return 'crosshair'
  }, [activeTool, isDragging])

  // ── Mouse events ──
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()
    const pos = getCanvasPos(e)
    const pt = pixelToPoint(pos.x, pos.y)
    if (!pt) return

    if (activeTool === 'cursor') {
      // Check hit against all drawings
      for (let i = drawings.length - 1; i >= 0; i--) {
        const d = drawings[i]
        const pxPoints = d.points.map(p => pointToPixel(p)).filter(Boolean) as Array<{ x: number; y: number }>
        if (hitTest(d, pos.x, pos.y, pxPoints)) {
          setSelectedId(d.id)
          setSelectedPos({ x: pos.x, y: pos.y })
          setIsDragging(true)
          setDragOffset({ dx: pos.x, dy: pos.y })
          return  // consumed — do NOT forward to chart
        }
      }
      // No drawing hit — deselect and let chart handle panning
      setSelectedId(null)
      setSelectedPos(null)
      forwardToChart(e, 'mousedown')
      return
    }

    if (!enabled) {
      // Non-cursor tools are blocked when drawing is disabled
      forwardToChart(e, 'mousedown')
      return
    }

    if (activeTool === 'eraser') {
      let erased = false
      const newDrawings = drawings.filter(d => {
        const pxPoints = d.points.map(p => pointToPixel(p)).filter(Boolean) as Array<{ x: number; y: number }>
        if (hitTest(d, pos.x, pos.y, pxPoints)) { erased = true; return false }
        return true
      })
      if (erased) setDrawingsAndHistory(newDrawings)
      return
    }

    // Text tools: show modal first
    if (['text', 'callout', 'note', 'price_label'].includes(activeTool)) {
      setPendingTextPoint(pt)
      setShowTextModal(true)
      return
    }

    // Brush: start collecting
    if (activeTool === 'brush') {
      brushPointsRef.current = [pt]
      const newDrawing: Drawing = {
        id: generateId(), type: activeTool,
        points: [pt], style: { ...currentStyle }, text: undefined
      }
      setActiveDrawingId(newDrawing.id)
      setDrawings(prev => [...prev, newDrawing])
      setIsDrawing(true)
      return
    }

    // Start drawing
    if (!isDrawing || !activeDrawingId) {
      const required = getRequiredPoints(activeTool)
      const newDrawing: Drawing = {
        id: generateId(), type: activeTool,
        points: [pt], style: { ...currentStyle }
      }
      setActiveDrawingId(newDrawing.id)
      setDrawings(prev => [...prev, newDrawing])
      if (required === 1) {
        setDrawingsAndHistory([...drawings, newDrawing])
        setIsDrawing(false)
        setActiveDrawingId(null)
      } else {
        setIsDrawing(true)
      }
      return
    }

    // Continue multi-point
    if (isDrawing && activeDrawingId) {
      setDrawings(prev => {
        const idx = prev.findIndex(d => d.id === activeDrawingId)
        if (idx === -1) return prev
        const d = prev[idx]
        const required = getRequiredPoints(d.type)

        if (MULTI_POINT_TOOLS.has(d.type)) {
          // Open-ended tools (polyline, elliott_wave etc): just append
          return prev.map((x, i) => i === idx ? { ...x, points: [...d.points, pt] } : x)
        }

        // Fixed-point tools: strip the mousemove preview (last point) then add actual click
        // This ensures klik ke-N menggunakan posisi click aktual, bukan posisi preview terakhir
        const basePoints = d.points.length >= 2 ? d.points.slice(0, -1) : d.points
        const newPoints = [...basePoints, pt]

        if (newPoints.length >= required) {
          const finalized = prev.map((x, i) => i === idx ? { ...x, points: newPoints } : x)
          setIsDrawing(false)
          setActiveDrawingId(null)
          pushHistory(finalized)
          return finalized
        }
        // Still drawing — save current points (tanpa preview, nanti mousemove akan tambah preview baru)
        return prev.map((x, i) => i === idx ? { ...x, points: newPoints } : x)
      })
    }
  }, [
    enabled, activeTool, drawings, isDrawing, activeDrawingId,
    getCanvasPos, pixelToPoint, pointToPixel, currentStyle, pushHistory,
    setDrawingsAndHistory
  ])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation()
    const pos = getCanvasPos(e)
    setCursorPos(pos)
    const pt = pixelToPoint(pos.x, pos.y)
    if (!pt) return

    // Drag selected drawing
    if (isDragging && selectedId && dragOffset) {
      // Hide floating toolbar while dragging
      if (selectedPos) setSelectedPos(null)
      const dx = pos.x - dragOffset.dx
      const dy = pos.y - dragOffset.dy
      setDrawings(prev => prev.map(d => {
        if (d.id !== selectedId) return d
        const newPoints = d.points.map(p => {
          const pp = pointToPixel(p)
          if (!pp) return p
          const np = pixelToPoint(pp.x + dx, pp.y + dy)
          return np ?? p
        })
        return { ...d, points: newPoints }
      }))
      setDragOffset({ dx: pos.x, dy: pos.y })
      return
    }

    // In cursor mode (not dragging): update hover state and forward to chart
    if (activeTool === 'cursor') {
      const hovering = drawings.some(d => {
        const pxPoints = d.points.map(p => pointToPixel(p)).filter(Boolean) as Array<{ x: number; y: number }>
        return hitTest(d, pos.x, pos.y, pxPoints)
      })
      setIsHoveringDrawing(hovering)
      // Forward to chart so crosshair / price label still updates
      forwardToChart(e, 'mousemove')
      return
    }

    // Brush continuous
    if (isDrawing && activeTool === 'brush' && activeDrawingId) {
      brushPointsRef.current.push(pt)
      setDrawings(prev => prev.map(d =>
        d.id === activeDrawingId ? { ...d, points: [...brushPointsRef.current] } : d
      ))
      return
    }

    // Preview second point for active drawing
    if (isDrawing && activeDrawingId) {
      setDrawings(prev => prev.map(d => {
        if (d.id !== activeDrawingId) return d
        const points = [...d.points]
        if (points.length >= 2) points[points.length - 1] = pt
        else if (points.length === 1) points.push(pt)
        return { ...d, points }
      }))
    }
  }, [
    isDragging, selectedId, dragOffset, selectedPos,
    isDrawing, activeTool, activeDrawingId, drawings,
    getCanvasPos, pixelToPoint, pointToPixel, forwardToChart
  ])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation()
    if (isDragging) {
      setIsDragging(false)
      setDragOffset(null)
      pushHistory(drawings)
    }
    if (activeTool === 'brush' && isDrawing) {
      setIsDrawing(false)
      setActiveDrawingId(null)
      pushHistory(drawings)
    }
    // In cursor mode always forward mouseup so chart releases its pan state
    if (activeTool === 'cursor') {
      forwardToChart(e, 'mouseup')
    }
  }, [isDragging, activeTool, isDrawing, drawings, pushHistory, forwardToChart])

  const handleDblClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation()
    e.preventDefault()
    // Finish multi-point tools
    if (isDrawing && activeDrawingId && MULTI_POINT_TOOLS.has(activeTool)) {
      setIsDrawing(false)
      setActiveDrawingId(null)
      pushHistory(drawings)
    }
  }, [isDrawing, activeDrawingId, activeTool, drawings, pushHistory])

  const handleTextConfirm = useCallback((text: string) => {
    setShowTextModal(false)
    if (!pendingTextPoint) return
    const newDrawing: Drawing = {
      id: generateId(), type: activeTool,
      points: [pendingTextPoint], style: { ...currentStyle }, text
    }
    setDrawingsAndHistory([...drawings, newDrawing])
    setPendingTextPoint(null)
  }, [pendingTextPoint, activeTool, currentStyle, drawings, setDrawingsAndHistory])

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    const newDrawings = drawings.filter(d => d.id !== selectedId)
    setDrawingsAndHistory(newDrawings)
    setSelectedId(null)
    setSelectedPos(null)
  }, [selectedId, drawings, setDrawingsAndHistory])

  const clearAll = useCallback(() => {
    setDrawingsAndHistory([])
    setSelectedId(null)
    setSelectedPos(null)
  }, [setDrawingsAndHistory])

  // ── Sync imperative actions ref and notify parent of state changes ──
  useEffect(() => {
    if (actionsRef) {
      actionsRef.current = { undo, redo, deleteSelected, clearAll }
    }
    onStateChange?.({
      canUndo: historyIdx > 0,
      canRedo: historyIdx < history.length - 1,
      hasSelected: !!selectedId,
      drawingsCount: drawings.length,
    })
  }, [actionsRef, onStateChange, undo, redo, deleteSelected, clearAll,
      historyIdx, history.length, selectedId, drawings.length])

  const toggleSelectedVisibility = useCallback(() => {
    if (!selectedId) return
    const newDrawings = drawings.map(d =>
      d.id === selectedId ? { ...d, hidden: !d.hidden } : d
    )
    setDrawingsAndHistory(newDrawings)
  }, [selectedId, drawings, setDrawingsAndHistory])

  const toggleSelectedLock = useCallback(() => {
    if (!selectedId) return
    const newDrawings = drawings.map(d =>
      d.id === selectedId ? { ...d, locked: !d.locked } : d
    )
    setDrawingsAndHistory(newDrawings)
  }, [selectedId, drawings, setDrawingsAndHistory])

  const duplicateSelected = useCallback(() => {
    if (!selectedId) return
    const d = drawings.find(x => x.id === selectedId)
    if (!d) return
    const newD: Drawing = {
      ...d,
      id: generateId(),
      points: d.points.map(p => ({ ...p, price: p.price + d.style.lineWidth * 0.001 }))
    }
    setDrawingsAndHistory([...drawings, newD])
    setSelectedId(newD.id)
  }, [selectedId, drawings, setDrawingsAndHistory])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) { e.preventDefault(); redo() }
      if (e.key === 'y' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redo() }
      if (e.key === 'Escape') {
        setIsDrawing(false); setActiveDrawingId(null); setActiveTool('cursor')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleteSelected, undo, redo])

  const selectedDrawing = drawings.find(d => d.id === selectedId)

  return (
    <>
      {/* Canvas overlay:
          - drawing tool active (not cursor) → intercept all events
          - cursor mode + drawings exist → intercept so drawings can be selected/dragged
          - cursor mode + no drawings    → transparent, chart works normally
          - drawing panel closed + no active tool → transparent */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-[2]"
        style={{
          cursor: activeTool !== 'cursor'
            ? 'crosshair'
            : isDragging
              ? 'grabbing'
              : isHoveringDrawing
                ? 'pointer'
                : 'default',
          // Intercept events when:
          // - drawing panel is open (drawing mode), OR
          // - drawings exist (so user can still select/delete them after panel closes), OR
          // - a non-cursor tool is active
          // Otherwise transparent so chart works normally.
          pointerEvents: (
            enabled && (!!panelOpen || drawings.length > 0 || activeTool !== 'cursor')
          ) ? 'auto' : 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDblClick}
      />

      {/* ── Floating mini-toolbar — appears at click position when a drawing is selected ── */}
      {selectedId && selectedPos && !showToolbar && (() => {
        const sd = drawings.find(d => d.id === selectedId)
        if (!sd) return null
        const canvas = canvasRef.current
        const rect = canvas?.getBoundingClientRect()
        if (!rect) return null

        // Position the toolbar above/below the click point, clamped inside canvas
        const TOOLBAR_W = 260
        const TOOLBAR_H = 44
        const GAP = 12
        let left = rect.left + selectedPos.x - TOOLBAR_W / 2
        let top  = rect.top  + selectedPos.y - TOOLBAR_H - GAP

        // Clamp horizontally
        left = Math.max(rect.left + 4, Math.min(left, rect.right - TOOLBAR_W - 4))
        // If too close to top, show below instead
        if (top < rect.top + 8) top = rect.top + selectedPos.y + GAP

        return (
          <div
            key={selectedId}
            className="fixed z-[60] flex items-center gap-0.5 bg-[#1a1f2e] border border-gray-700/60 rounded-xl shadow-2xl px-2 py-1.5 backdrop-blur-sm"
            style={{ left, top, minWidth: TOOLBAR_W }}
            onMouseDown={e => e.stopPropagation()}
          >
            {/* Drawing type label */}
            <span className="text-[10px] text-gray-500 font-medium px-1 mr-1 truncate max-w-[64px]">
              {TOOL_GROUPS.flatMap(g => g.tools).find(t => t.id === sd.type)?.label ?? sd.type}
            </span>

            <div className="w-px h-5 bg-gray-700/60 mx-0.5" />

            {/* Undo */}
            <button title="Undo (Ctrl+Z)" onClick={undo} disabled={historyIdx <= 0}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            {/* Redo */}
            <button title="Redo (Ctrl+Y)" onClick={redo} disabled={historyIdx >= history.length - 1}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors">
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-5 bg-gray-700/60 mx-0.5" />

            {/* Hide/Show */}
            <button title={sd.hidden ? 'Tampilkan' : 'Sembunyikan'} onClick={toggleSelectedVisibility}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              {sd.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            {/* Lock/Unlock */}
            <button title={sd.locked ? 'Buka Kunci' : 'Kunci'} onClick={toggleSelectedLock}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              {sd.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            </button>
            {/* Duplicate */}
            <button title="Duplikat" onClick={duplicateSelected}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Copy className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-5 bg-gray-700/60 mx-0.5" />

            {/* Delete */}
            <button title="Hapus (Del)" onClick={deleteSelected}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Dismiss */}
            <button title="Tutup" onClick={() => { setSelectedId(null); setSelectedPos(null) }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors ml-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })()}


      {showTextModal && (
        <TextInputModal
          onConfirm={handleTextConfirm}
          onCancel={() => { setShowTextModal(false); setPendingTextPoint(null) }}
        />
      )}

      {/* Backdrop when panel open — fixed like IndicatorControls */}
      {showToolbar && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => { setShowToolbar(false); onPanelClose?.() }}
        />
      )}

      {/* Drawing Tools Panel — fixed, slide in from left, page-level like IndicatorControls */}
      {showToolbar && (
        <div
          className="fixed top-0 left-0 bottom-0 w-full sm:w-80 bg-[#0f1419] border-r border-gray-800/50 z-50 flex flex-col overflow-hidden"
          style={{ animation: 'slideRight 0.3s cubic-bezier(0.16,1,0.3,1)' }}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#1a1f2e] border-b border-gray-800/50 flex-shrink-0">
            <div className="h-14 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg">Drawing Tools</h3>
                {drawings.length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    {drawings.length}
                  </span>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="px-4 pb-3">
              <input
                type="text"
                placeholder="Cari drawing tool..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f1419] border border-gray-800/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Active tool indicator bar */}
          {activeTool !== 'cursor' && (
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs text-blue-300 font-medium">
                  {TOOL_GROUPS.flatMap(g => g.tools).find(t => t.id === activeTool)?.label ?? activeTool}
                </span>
                {MULTI_POINT_TOOLS.has(activeTool) && (
                  <span className="text-xs text-gray-500">— Double-click selesai</span>
                )}
              </div>
              <button
                className="text-gray-500 hover:text-white transition-colors"
                onClick={() => { setActiveTool('cursor'); setIsDrawing(false); setActiveDrawingId(null) }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Selected drawing actions */}
          {selectedId && activeTool === 'cursor' && (
            <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 bg-[#1a1f2e] border-b border-gray-800/50">
              <span className="text-xs text-gray-400 mr-1">Dipilih:</span>
              <button title="Sembunyikan/Tampilkan" onClick={toggleSelectedVisibility}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors">
                {selectedDrawing?.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button title="Kunci/Buka" onClick={toggleSelectedLock}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors">
                {selectedDrawing?.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </button>
              <button title="Duplikat" onClick={duplicateSelected}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button title="Hapus (Del)" onClick={deleteSelected}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Tool list */}
          <div className="flex-1 overflow-y-auto">
            {TOOL_GROUPS.map(group => {
              const filteredTools = group.tools.filter(t =>
                !searchQuery ||
                t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                group.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
              if (filteredTools.length === 0) return null
              const isGroupExpanded = expandedGroup === group.label || !!searchQuery

              return (
                <div key={group.label}>
                  {/* Group header */}
                  <button
                    onClick={() => setExpandedGroup(isGroupExpanded && !searchQuery ? null : group.label)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1a1f2e] hover:bg-[#232936] transition-colors border-b border-gray-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <group.icon className={`w-4 h-4 ${group.tools.some(t => t.id === activeTool) ? 'text-blue-400' : 'text-gray-500'}`} />
                      <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">{group.label}</span>
                      {group.tools.some(t => t.id === activeTool) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isGroupExpanded ? '' : '-rotate-90'}`} />
                  </button>

                  {/* Tools in group */}
                  {isGroupExpanded && filteredTools.map(tool => {
                    const isActive = activeTool === tool.id
                    return (
                      <div
                        key={tool.id}
                        className={`border-b border-gray-800/50 last:border-0 ${isActive ? 'bg-blue-500/10' : ''}`}
                      >
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#232936] transition-colors text-left"
                          onClick={() => {
                            setActiveTool(tool.id as DrawingToolType)
                            setIsDrawing(false)
                            setActiveDrawingId(null)
                            // Auto-close panel so canvas is accessible for drawing
                            setShowToolbar(false)
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <tool.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium ${isActive ? 'text-blue-300' : 'text-white'}`}>{tool.label}</div>
                              <div className="text-xs text-gray-500 truncate">{group.label}</div>
                            </div>
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 ml-2" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Style section */}
            <div>
              <button
                onClick={() => setShowStylePanel(s => !s)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[#1a1f2e] hover:bg-[#232936] transition-colors border-b border-gray-800/50 border-t border-t-gray-800/50 mt-2"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className={`w-4 h-4 ${showStylePanel ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Gaya Drawing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-gray-600" style={{ background: currentStyle.color }} />
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showStylePanel ? '' : '-rotate-90'}`} />
                </div>
              </button>
              {showStylePanel && (
                <StylePanel style={currentStyle} onChange={s => {
                  setCurrentStyle(s)
                  if (selectedId) {
                    const newDrawings = drawings.map(d => d.id === selectedId ? { ...d, style: s } : d)
                    setDrawingsAndHistory(newDrawings)
                  }
                }} />
              )}
            </div>
          </div>

          {/* Footer — Undo / Redo / Clear */}
          <div className="h-14 bg-[#1a1f2e] border-t border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-1">
              <button title="Undo (Ctrl+Z)" onClick={undo} disabled={historyIdx <= 0}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#232936] rounded-lg transition-colors disabled:opacity-30">
                <Undo2 className="w-4 h-4" />
              </button>
              <button title="Redo (Ctrl+Y)" onClick={redo} disabled={historyIdx >= history.length - 1}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#232936] rounded-lg transition-colors disabled:opacity-30">
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={clearAll}
              className="text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 hover:bg-red-500/10 rounded-lg"
            >
              Hapus Semua
            </button>
          </div>
        </div>
      )}

      {/* Active tool indicator — small non-intrusive bar at bottom when drawing */}
    </>
  )
})

DrawingTools.displayName = 'DrawingTools'
export default DrawingTools
export { TOOL_GROUPS, DEFAULT_STYLE }

// Inject animation keyframe once
if (typeof document !== 'undefined') {
  const styleId = 'drawing-tools-anim'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes slideRight {
        from { transform: translateX(-100%); }
        to   { transform: translateX(0); }
      }
    `
    document.head.appendChild(style)
  }
}