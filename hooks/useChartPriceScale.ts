// hooks/useChartPriceScale.ts - FINAL COMPLETE VERSION
import { useRef, useCallback } from 'react'
import { IChartApi, ISeriesApi } from 'lightweight-charts'

export function useChartPriceScale() {
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)

  const setChart = useCallback((chart: IChartApi | null) => {
    chartRef.current = chart
  }, [])

  const setSeries = useCallback((series: ISeriesApi<any> | null) => {
    seriesRef.current = series
  }, [])

  const priceToPixel = useCallback((price: number): number | null => {
    if (!chartRef.current || !seriesRef.current) {
      return null
    }

    try {
      const yCoordinate = seriesRef.current.priceToCoordinate(price)
      
      if (yCoordinate === null || yCoordinate === undefined) {
        return null
      }

      return yCoordinate
    } catch (error) {
      console.error('Price to pixel conversion error:', error)
      return null
    }
  }, [])

  const pixelToPrice = useCallback((yPixel: number): number | null => {
    if (!chartRef.current || !seriesRef.current) {
      return null
    }

    try {
      // ✅ FIXED: Call coordinateToPrice directly on series
      const price = seriesRef.current.coordinateToPrice(yPixel)
      
      if (price === null || price === undefined) {
        return null
      }

      return price
    } catch (error) {
      console.error('Pixel to price conversion error:', error)
      return null
    }
  }, [])

  /**
   * Get visible time range
   */
  const getVisibleRange = useCallback(() => {
    if (!chartRef.current) {
      return null
    }

    try {
      const timeScale = chartRef.current.timeScale()
      const visibleRange = timeScale.getVisibleRange()
      
      return visibleRange
    } catch (error) {
      console.error('Get visible range error:', error)
      return null
    }
  }, [])

  return {
    setChart,
    setSeries,
    priceToPixel,
    pixelToPrice,
    getVisibleRange,
  }
}