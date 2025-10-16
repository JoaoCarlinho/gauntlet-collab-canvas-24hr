/**
 * Edge Detection Utility
 * 
 * Provides edge detection functionality for canvas objects to enable
 * cursor changes and direct edge resizing when hovering over object edges.
 */

import { CanvasObject } from '../types'

export interface EdgeDetectionResult {
  isNearEdge: boolean
  edgeType: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null
  distance: number
  cursor: string
}

export interface ObjectBounds {
  x: number
  y: number
  width: number
  height: number
  radius?: number
}

export class EdgeDetector {
  /**
   * Main edge detection method that determines if the mouse cursor is near an object edge
   * @param mouseX - X coordinate of mouse cursor
   * @param mouseY - Y coordinate of mouse cursor
   * @param object - Canvas object to check
   * @param threshold - Distance threshold for edge detection (default: 10px)
   * @returns Edge detection result with edge type and cursor
   */
  static detectEdge(
    mouseX: number, 
    mouseY: number, 
    object: CanvasObject, 
    threshold: number = 10
  ): EdgeDetectionResult {
    if (!object || !object.properties) {
      return this.createNoEdgeResult()
    }

    switch (object.object_type) {
      case 'rectangle':
        return this.detectRectangleEdge(mouseX, mouseY, object.properties, threshold)
      case 'circle':
        return this.detectCircleEdge(mouseX, mouseY, object.properties, threshold)
      case 'text':
        return this.detectTextEdge(mouseX, mouseY, object.properties, threshold)
      case 'heart':
      case 'star':
      case 'diamond':
        return this.detectShapeEdge(mouseX, mouseY, object.properties, threshold)
      case 'line':
      case 'arrow':
        return this.detectLineEdge(mouseX, mouseY, object.properties, threshold)
      default:
        return this.createNoEdgeResult()
    }
  }

  /**
   * Detect edges for rectangle objects
   */
  static detectRectangleEdge(
    mouseX: number, 
    mouseY: number, 
    props: any, 
    threshold: number
  ): EdgeDetectionResult {
    const bounds = this.getRectangleBounds(props)
    return this.detectRectangularEdges(mouseX, mouseY, bounds, threshold)
  }

  /**
   * Detect edges for circle objects
   */
  static detectCircleEdge(
    mouseX: number, 
    mouseY: number, 
    props: any, 
    threshold: number
  ): EdgeDetectionResult {
    const centerX = props.x
    const centerY = props.y
    const radius = props.radius || 20

    // Calculate distance from mouse to circle center
    const distance = Math.sqrt((mouseX - centerX) ** 2 + (mouseY - centerY) ** 2)
    
    // Check if mouse is within threshold of circle edge
    const edgeDistance = Math.abs(distance - radius)
    
    if (edgeDistance <= threshold) {
      // Determine which edge direction based on angle
      const angle = Math.atan2(mouseY - centerY, mouseX - centerX)
      const edgeType = this.getCircleEdgeType(angle)
      
      return {
        isNearEdge: true,
        edgeType,
        distance: edgeDistance,
        cursor: this.getCursorForEdgeType(edgeType)
      }
    }

    return this.createNoEdgeResult()
  }

  /**
   * Detect edges for text objects
   */
  static detectTextEdge(
    mouseX: number, 
    mouseY: number, 
    props: any, 
    threshold: number
  ): EdgeDetectionResult {
    // Calculate text bounds
    const textWidth = (props.text?.length || 0) * (props.fontSize || 16) * 0.6
    const textHeight = (props.fontSize || 16) * 1.2
    
    const bounds: ObjectBounds = {
      x: props.x,
      y: props.y,
      width: textWidth,
      height: textHeight
    }

    // For text, we only detect the right edge (east) for resizing
    const rightEdgeDistance = Math.abs(mouseX - (bounds.x + bounds.width))
    const isNearRightEdge = rightEdgeDistance <= threshold && 
                           mouseY >= bounds.y && 
                           mouseY <= bounds.y + bounds.height

    if (isNearRightEdge) {
      return {
        isNearEdge: true,
        edgeType: 'e',
        distance: rightEdgeDistance,
        cursor: this.getCursorForEdgeType('e')
      }
    }

    return this.createNoEdgeResult()
  }

  /**
   * Detect edges for shape objects (heart, star, diamond)
   */
  static detectShapeEdge(
    mouseX: number, 
    mouseY: number, 
    props: any, 
    threshold: number
  ): EdgeDetectionResult {
    // Shapes are treated like rectangles for edge detection
    const bounds = this.getRectangleBounds(props)
    return this.detectRectangularEdges(mouseX, mouseY, bounds, threshold)
  }

  /**
   * Detect edges for line and arrow objects
   */
  static detectLineEdge(
    mouseX: number, 
    mouseY: number, 
    props: any, 
    threshold: number
  ): EdgeDetectionResult {
    const points = props.points || [props.x, props.y, props.x + 100, props.y]
    
    if (points.length < 4) {
      return this.createNoEdgeResult()
    }

    const startX = points[0]
    const startY = points[1]
    const endX = points[2]
    const endY = points[3]

    // Check distance to start point
    const startDistance = Math.sqrt((mouseX - startX) ** 2 + (mouseY - startY) ** 2)
    if (startDistance <= threshold) {
      return {
        isNearEdge: true,
        edgeType: 'nw', // Start point acts like nw corner
        distance: startDistance,
        cursor: this.getCursorForEdgeType('nw')
      }
    }

    // Check distance to end point
    const endDistance = Math.sqrt((mouseX - endX) ** 2 + (mouseY - endY) ** 2)
    if (endDistance <= threshold) {
      return {
        isNearEdge: true,
        edgeType: 'se', // End point acts like se corner
        distance: endDistance,
        cursor: this.getCursorForEdgeType('se')
      }
    }

    return this.createNoEdgeResult()
  }

  /**
   * Detect edges for rectangular objects (rectangle, shapes)
   */
  private static detectRectangularEdges(
    mouseX: number, 
    mouseY: number, 
    bounds: ObjectBounds, 
    threshold: number
  ): EdgeDetectionResult {
    const { x, y, width, height } = bounds

    // Check if mouse is within object bounds (with threshold)
    const isWithinBounds = mouseX >= x - threshold && 
                          mouseX <= x + width + threshold && 
                          mouseY >= y - threshold && 
                          mouseY <= y + height + threshold

    if (!isWithinBounds) {
      return this.createNoEdgeResult()
    }

    // Calculate distances to each edge
    const distances = {
      top: Math.abs(mouseY - y),
      bottom: Math.abs(mouseY - (y + height)),
      left: Math.abs(mouseX - x),
      right: Math.abs(mouseX - (x + width))
    }

    // Find the closest edge
    let closestEdge: string | null = null
    let minDistance = threshold + 1

    // Check horizontal edges
    if (mouseX >= x && mouseX <= x + width) {
      if (distances.top <= threshold && distances.top < minDistance) {
        closestEdge = 'n'
        minDistance = distances.top
      }
      if (distances.bottom <= threshold && distances.bottom < minDistance) {
        closestEdge = 's'
        minDistance = distances.bottom
      }
    }

    // Check vertical edges
    if (mouseY >= y && mouseY <= y + height) {
      if (distances.left <= threshold && distances.left < minDistance) {
        closestEdge = 'w'
        minDistance = distances.left
      }
      if (distances.right <= threshold && distances.right < minDistance) {
        closestEdge = 'e'
        minDistance = distances.right
      }
    }

    // Check corners
    const cornerThreshold = threshold * 1.2 // Slightly larger threshold for corners
    const cornerDistances = {
      nw: Math.sqrt(distances.left ** 2 + distances.top ** 2),
      ne: Math.sqrt(distances.right ** 2 + distances.top ** 2),
      sw: Math.sqrt(distances.left ** 2 + distances.bottom ** 2),
      se: Math.sqrt(distances.right ** 2 + distances.bottom ** 2)
    }

    Object.entries(cornerDistances).forEach(([corner, distance]) => {
      if (distance <= cornerThreshold && distance < minDistance) {
        closestEdge = corner
        minDistance = distance
      }
    })

    if (closestEdge) {
      return {
        isNearEdge: true,
        edgeType: closestEdge as any,
        distance: minDistance,
        cursor: this.getCursorForEdgeType(closestEdge)
      }
    }

    return this.createNoEdgeResult()
  }

  /**
   * Get rectangle bounds from object properties
   */
  private static getRectangleBounds(props: any): ObjectBounds {
    return {
      x: props.x || 0,
      y: props.y || 0,
      width: props.width || 100,
      height: props.height || 100
    }
  }

  /**
   * Get circle edge type based on angle
   */
  private static getCircleEdgeType(angle: number): 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' {
    // Convert angle to degrees and normalize to 0-360
    const degrees = ((angle * 180 / Math.PI) + 360) % 360

    // Map angle ranges to edge types
    if (degrees >= 337.5 || degrees < 22.5) return 'e'
    if (degrees >= 22.5 && degrees < 67.5) return 'ne'
    if (degrees >= 67.5 && degrees < 112.5) return 'n'
    if (degrees >= 112.5 && degrees < 157.5) return 'nw'
    if (degrees >= 157.5 && degrees < 202.5) return 'w'
    if (degrees >= 202.5 && degrees < 247.5) return 'sw'
    if (degrees >= 247.5 && degrees < 292.5) return 's'
    if (degrees >= 292.5 && degrees < 337.5) return 'se'

    return 'e' // Default fallback
  }

  /**
   * Get cursor CSS value for edge type
   */
  private static getCursorForEdgeType(edgeType: string): string {
    const cursorMap: Record<string, string> = {
      'n': 'n-resize',
      's': 's-resize',
      'e': 'e-resize',
      'w': 'w-resize',
      'ne': 'ne-resize',
      'nw': 'nw-resize',
      'se': 'se-resize',
      'sw': 'sw-resize'
    }
    return cursorMap[edgeType] || 'default'
  }

  /**
   * Create a no-edge result
   */
  private static createNoEdgeResult(): EdgeDetectionResult {
    return {
      isNearEdge: false,
      edgeType: null,
      distance: Infinity,
      cursor: 'default'
    }
  }

  /**
   * Check if a point is within object bounds (with optional padding)
   */
  static isPointInObject(
    mouseX: number, 
    mouseY: number, 
    object: CanvasObject, 
    padding: number = 0
  ): boolean {
    if (!object || !object.properties) {
      return false
    }

    switch (object.object_type) {
      case 'rectangle':
      case 'heart':
      case 'star':
      case 'diamond':
        const rectBounds = this.getRectangleBounds(object.properties)
        return mouseX >= rectBounds.x - padding && 
               mouseX <= rectBounds.x + rectBounds.width + padding && 
               mouseY >= rectBounds.y - padding && 
               mouseY <= rectBounds.y + rectBounds.height + padding

      case 'circle':
        const centerX = object.properties.x
        const centerY = object.properties.y
        const radius = object.properties.radius || 20
        const distance = Math.sqrt((mouseX - centerX) ** 2 + (mouseY - centerY) ** 2)
        return distance <= radius + padding

      case 'text':
        const textWidth = (object.properties.text?.length || 0) * (object.properties.fontSize || 16) * 0.6
        const textHeight = (object.properties.fontSize || 16) * 1.2
        return mouseX >= object.properties.x - padding && 
               mouseX <= object.properties.x + textWidth + padding && 
               mouseY >= object.properties.y - padding && 
               mouseY <= object.properties.y + textHeight + padding

      case 'line':
      case 'arrow':
        // For lines, check if point is near the line path
        const points = object.properties.points || [object.properties.x, object.properties.y, object.properties.x + 100, object.properties.y]
        if (points.length >= 4) {
          const startX = points[0]
          const startY = points[1]
          const endX = points[2]
          const endY = points[3]
          
          // Simple distance to line segment check
          const lineDistance = this.distanceToLineSegment(mouseX, mouseY, startX, startY, endX, endY)
          return lineDistance <= padding + 5 // 5px tolerance for line thickness
        }
        return false

      default:
        return false
    }
  }

  /**
   * Calculate distance from point to line segment
   */
  private static distanceToLineSegment(
    px: number, py: number, 
    x1: number, y1: number, 
    x2: number, y2: number
  ): number {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B)
    }

    let param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
  }
}

export default EdgeDetector

