/**
 * Tests for Edge Detection Utility
 */

import { EdgeDetector, EdgeDetectionResult } from '../edgeDetection'
import { CanvasObject } from '../../types'

describe('EdgeDetector', () => {
  describe('Rectangle Edge Detection', () => {
    const rectangleObject: CanvasObject = {
      id: 'test-rect',
      canvas_id: 'test-canvas',
      object_type: 'rectangle',
      properties: {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#ff0000'
      },
      created_by: 'test-user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('should detect north edge', () => {
      const result = EdgeDetector.detectEdge(200, 105, rectangleObject, 10)
      expect(result.isNearEdge).toBe(true)
      expect(result.edgeType).toBe('n')
      expect(result.cursor).toBe('n-resize')
    })

    it('should detect south edge', () => {
      const result = EdgeDetector.detectEdge(200, 245, rectangleObject, 10)
      expect(result.isNearEdge).toBe(true)
      expect(result.edgeType).toBe('s')
      expect(result.cursor).toBe('s-resize')
    })

    it('should detect east edge', () => {
      const result = EdgeDetector.detectEdge(295, 175, rectangleObject, 10)
      expect(result.isNearEdge).toBe(true)
      expect(result.edgeType).toBe('e')
      expect(result.cursor).toBe('e-resize')
    })

    it('should detect west edge', () => {
      const result = EdgeDetector.detectEdge(105, 175, rectangleObject, 10)
      expect(result.isNearEdge).toBe(true)
      expect(result.edgeType).toBe('w')
      expect(result.cursor).toBe('w-resize')
    })

    it('should detect northwest corner', () => {
      const result = EdgeDetector.detectEdge(105, 105, rectangleObject, 10)
      expect(result.isNearEdge).toBe(true)
      expect(result.edgeType).toBe('nw')
      expect(result.cursor).toBe('nw-resize')
    })

    it('should not detect edge when far from object', () => {
      const result = EdgeDetector.detectEdge(50, 50, rectangleObject, 10)
      expect(result.isNearEdge).toBe(false)
      expect(result.edgeType).toBe(null)
    })

    it('should not detect edge when inside object', () => {
      const result = EdgeDetector.detectEdge(200, 175, rectangleObject, 10)
      expect(result.isNearEdge).toBe(false)
      expect(result.edgeType).toBe(null)
    })
  })

  describe('Circle Edge Detection', () => {
    const circleObject: CanvasObject = {
      id: 'test-circle',
      canvas_id: 'test-canvas',
      object_type: 'circle',
      properties: {
        x: 100,
        y: 100,
        radius: 50,
        fill: '#00ff00'
      },
      created_by: 'test-user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('should detect edge when near circle perimeter', () => {
      const result = EdgeDetector.detectEdge(150, 100, circleObject, 10) // Right edge
      expect(result.isNearEdge).toBe(true)
      expect(result.edgeType).toBe('e')
      expect(result.cursor).toBe('e-resize')
    })

    it('should not detect edge when inside circle', () => {
      const result = EdgeDetector.detectEdge(100, 100, circleObject, 10) // Center
      expect(result.isNearEdge).toBe(false)
    })

    it('should not detect edge when far from circle', () => {
      const result = EdgeDetector.detectEdge(200, 200, circleObject, 10)
      expect(result.isNearEdge).toBe(false)
    })
  })

  describe('Text Edge Detection', () => {
    const textObject: CanvasObject = {
      id: 'test-text',
      canvas_id: 'test-canvas',
      object_type: 'text',
      properties: {
        x: 100,
        y: 100,
        text: 'Hello World',
        fontSize: 16,
        fill: '#0000ff'
      },
      created_by: 'test-user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('should detect right edge for text resizing', () => {
      // Text width is approximately: 11 * 16 * 0.6 = 105.6
      const result = EdgeDetector.detectEdge(210, 110, textObject, 10)
      expect(result.isNearEdge).toBe(true)
      expect(result.edgeType).toBe('e')
      expect(result.cursor).toBe('e-resize')
    })

    it('should not detect other edges for text', () => {
      const result = EdgeDetector.detectEdge(110, 105, textObject, 10) // Top edge
      expect(result.isNearEdge).toBe(false)
    })
  })

  describe('Point in Object Detection', () => {
    const rectangleObject: CanvasObject = {
      id: 'test-rect',
      canvas_id: 'test-canvas',
      object_type: 'rectangle',
      properties: {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        fill: '#ff0000'
      },
      created_by: 'test-user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('should detect point inside rectangle', () => {
      const result = EdgeDetector.isPointInObject(200, 175, rectangleObject)
      expect(result).toBe(true)
    })

    it('should not detect point outside rectangle', () => {
      const result = EdgeDetector.isPointInObject(50, 50, rectangleObject)
      expect(result).toBe(false)
    })

    it('should detect point with padding', () => {
      const result = EdgeDetector.isPointInObject(95, 95, rectangleObject, 10)
      expect(result).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle null object', () => {
      const result = EdgeDetector.detectEdge(100, 100, null as any, 10)
      expect(result.isNearEdge).toBe(false)
    })

    it('should handle object without properties', () => {
      const invalidObject: CanvasObject = {
        id: 'test',
        canvas_id: 'test-canvas',
        object_type: 'rectangle',
        properties: {},
        created_by: 'test-user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
      
      const result = EdgeDetector.detectEdge(100, 100, invalidObject, 10)
      expect(result.isNearEdge).toBe(false)
    })

    it('should handle zero threshold', () => {
      const rectangleObject: CanvasObject = {
        id: 'test-rect',
        canvas_id: 'test-canvas',
        object_type: 'rectangle',
        properties: {
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#ff0000'
        },
        created_by: 'test-user',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const result = EdgeDetector.detectEdge(100, 100, rectangleObject, 0) // Exactly on edge
      expect(result.isNearEdge).toBe(true)
    })
  })
})


