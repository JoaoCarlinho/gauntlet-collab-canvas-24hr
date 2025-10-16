# 🎯 **Object Resizing and Panning Implementation Plan**

## **Executive Summary**

This document outlines a comprehensive plan to implement four key features for enhanced canvas interaction:

1. **Cursor Detection for Object Edges** - Change cursor to resize arrows when hovering over object edges
2. **Object Resizing** - Click and drag to resize objects when cursor is over edges
3. **Spacebar Panning** - Press spacebar + drag to pan the canvas
4. **Object Visibility** - Ensure objects remain visible when moved/resized

## **Current Implementation Analysis**

### ✅ **What's Already Implemented**

#### **Object Resizing Infrastructure (90% Complete)**
- **ResizeHandles Component**: Complete with 8 handles for rectangles, corner handles for circles
- **Cursor Management**: `cursorManager` with resize cursor support
- **Resize Logic**: Full resize calculations for all object types (rectangle, circle, text, shapes, lines)
- **Real-time Updates**: Socket integration for live resize updates
- **Visual Feedback**: Hover states and cursor changes for resize handles

#### **Canvas Panning Infrastructure (80% Complete)**
- **ZoomableCanvas Component**: Complete zoom and pan functionality
- **Pan Controls**: Middle mouse button and Ctrl+click panning
- **Touch Support**: Pinch-to-zoom and touch panning
- **Keyboard Shortcuts**: Ctrl+scroll zoom, Ctrl+0 reset, Ctrl+1 fit-to-screen
- **Visual Feedback**: Panning indicators and cursor changes

#### **Object Selection System (95% Complete)**
- **Selection Indicators**: Visual selection borders and hover states
- **Object Interaction**: Click to select, drag to move
- **Tool Integration**: Select tool with proper cursor management
- **Real-time Sync**: Socket-based object updates

### ❌ **What's Missing (10-20% Gap)**

#### **1. Edge Detection for Cursor Changes**
- **Missing**: Automatic cursor change when hovering over object edges (not just handles)
- **Current**: Cursor only changes when hovering over explicit resize handles
- **Need**: Detect when cursor is near object edges and show resize cursor

#### **2. Spacebar Panning**
- **Missing**: Spacebar + drag panning functionality
- **Current**: Only middle mouse button and Ctrl+click panning
- **Need**: Spacebar key detection and drag-to-pan integration

#### **3. Object Edge Resizing**
- **Missing**: Direct edge resizing without explicit handles
- **Current**: Only resize via explicit handles
- **Need**: Click and drag on object edges to resize

#### **4. Enhanced Object Visibility**
- **Missing**: Boundary checking to prevent objects from disappearing
- **Current**: Objects can be moved/resized outside visible area
- **Need**: Constraint system to keep objects visible

---

## **📋 Implementation Tasks**

### **Phase 1: Edge Detection and Cursor Management (2-3 days)**

#### **Task 1.1: Create Edge Detection System**
```typescript
// New file: frontend/src/utils/edgeDetection.ts
interface EdgeDetectionResult {
  isNearEdge: boolean
  edgeType: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null
  distance: number
  cursor: string
}

class EdgeDetector {
  static detectEdge(
    mouseX: number, 
    mouseY: number, 
    object: CanvasObject, 
    threshold: number = 10
  ): EdgeDetectionResult {
    // Implementation needed:
    // 1. Calculate object bounds
    // 2. Check if mouse is within threshold of any edge
    // 3. Determine which edge is closest
    // 4. Return appropriate cursor type
  }
}
```

#### **Task 1.2: Integrate Edge Detection with Canvas**
```typescript
// File: frontend/src/components/CanvasPage.tsx
// Add edge detection to mouse move handler:

const handleStageMouseMove = (e: any) => {
  const stage = e.target.getStage()
  const pointerPosition = stage.getPointerPosition()
  
  // Check for edge detection on hovered objects
  if (selectedTool.id === 'select') {
    const edgeResult = EdgeDetector.detectEdge(
      pointerPosition.x, 
      pointerPosition.y, 
      hoveredObject
    )
    
    if (edgeResult.isNearEdge) {
      cursorManager.setCursor(edgeResult.cursor)
    } else {
      cursorManager.resetCursor()
    }
  }
}
```

#### **Task 1.3: Update Cursor Manager**
```typescript
// File: frontend/src/utils/cursorManager.ts
// Add edge-based cursor support:

class CursorManager {
  setEdgeCursor(edgeType: string) {
    const cursorMap = {
      'n': 'n-resize',
      's': 's-resize', 
      'e': 'e-resize',
      'w': 'w-resize',
      'ne': 'ne-resize',
      'nw': 'nw-resize',
      'se': 'se-resize',
      'sw': 'sw-resize'
    }
    
    this.setCursor(cursorMap[edgeType] || 'default')
  }
}
```

### **Phase 2: Direct Edge Resizing (2-3 days)**

#### **Task 2.1: Create Edge Resize Handler**
```typescript
// File: frontend/src/components/CanvasPage.tsx
// Add edge resize functionality:

const handleEdgeResize = (objectId: string, edgeType: string, startPos: {x: number, y: number}, currentPos: {x: number, y: number}) => {
  const object = objects.find(obj => obj.id === objectId)
  if (!object) return
  
  const deltaX = currentPos.x - startPos.x
  const deltaY = currentPos.y - startPos.y
  
  const newProperties = calculateEdgeResize(object, edgeType, deltaX, deltaY)
  handleObjectResize(objectId, newProperties)
}

const calculateEdgeResize = (object: CanvasObject, edgeType: string, deltaX: number, deltaY: number) => {
  const props = { ...object.properties }
  
  switch (object.object_type) {
    case 'rectangle':
      return calculateRectangleEdgeResize(props, edgeType, deltaX, deltaY)
    case 'circle':
      return calculateCircleEdgeResize(props, edgeType, deltaX, deltaY)
    // ... other object types
  }
}
```

#### **Task 2.2: Add Mouse Event Handlers for Edge Resizing**
```typescript
// File: frontend/src/components/CanvasPage.tsx
// Add mouse down/up handlers for edge resizing:

const [isEdgeResizing, setIsEdgeResizing] = useState(false)
const [edgeResizeData, setEdgeResizeData] = useState<{
  objectId: string
  edgeType: string
  startPos: {x: number, y: number}
} | null>(null)

const handleStageMouseDown = (e: any) => {
  if (selectedTool.id === 'select') {
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    // Check for edge detection
    const edgeResult = EdgeDetector.detectEdge(pointerPosition.x, pointerPosition.y, hoveredObject)
    
    if (edgeResult.isNearEdge && hoveredObjectId) {
      setIsEdgeResizing(true)
      setEdgeResizeData({
        objectId: hoveredObjectId,
        edgeType: edgeResult.edgeType,
        startPos: pointerPosition
      })
      e.evt.preventDefault()
    }
  }
}

const handleStageMouseMove = (e: any) => {
  if (isEdgeResizing && edgeResizeData) {
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    handleEdgeResize(
      edgeResizeData.objectId,
      edgeResizeData.edgeType,
      edgeResizeData.startPos,
      pointerPosition
    )
  } else {
    // Existing mouse move logic for edge detection
  }
}

const handleStageMouseUp = (e: any) => {
  if (isEdgeResizing) {
    setIsEdgeResizing(false)
    setEdgeResizeData(null)
  }
}
```

### **Phase 3: Spacebar Panning (1-2 days)**

#### **Task 3.1: Add Spacebar Detection**
```typescript
// File: frontend/src/hooks/useSpacebarPanning.ts
// New hook for spacebar panning:

export const useSpacebarPanning = (onStartPan: (x: number, y: number) => void, onUpdatePan: (x: number, y: number) => void, onEndPan: () => void) => {
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacebarPressed) {
        e.preventDefault()
        setIsSpacebarPressed(true)
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSpacebarPressed) {
        e.preventDefault()
        setIsSpacebarPressed(false)
        if (isPanning) {
          setIsPanning(false)
          onEndPan()
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isSpacebarPressed, isPanning])
  
  const handleMouseDown = (e: any) => {
    if (isSpacebarPressed && e.evt.button === 0) {
      e.evt.preventDefault()
      const stage = e.target.getStage()
      const pointerPosition = stage.getPointerPosition()
      setIsPanning(true)
      onStartPan(pointerPosition.x, pointerPosition.y)
    }
  }
  
  const handleMouseMove = (e: any) => {
    if (isPanning && isSpacebarPressed) {
      const stage = e.target.getStage()
      const pointerPosition = stage.getPointerPosition()
      onUpdatePan(pointerPosition.x, pointerPosition.y)
    }
  }
  
  const handleMouseUp = (e: any) => {
    if (isPanning) {
      setIsPanning(false)
      onEndPan()
    }
  }
  
  return {
    isSpacebarPressed,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
```

#### **Task 3.2: Integrate Spacebar Panning with ZoomableCanvas**
```typescript
// File: frontend/src/components/ZoomableCanvas.tsx
// Integrate spacebar panning:

const ZoomableCanvas: React.FC<ZoomableCanvasProps> = ({ ... }) => {
  const { startPan, updatePan, endPan } = useCanvasZoom()
  
  const {
    isSpacebarPressed,
    isPanning: isSpacebarPanning,
    handleMouseDown: handleSpacebarMouseDown,
    handleMouseMove: handleSpacebarMouseMove,
    handleMouseUp: handleSpacebarMouseUp
  } = useSpacebarPanning(startPan, updatePan, endPan)
  
  const handleMouseDown = useCallback((e: any) => {
    // Handle spacebar panning first
    handleSpacebarMouseDown(e)
    
    // Then handle existing panning logic
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.ctrlKey)) {
      // Existing middle mouse button or Ctrl + left click panning
    }
  }, [handleSpacebarMouseDown, startPan, onStageMouseDown])
  
  const handleMouseMove = useCallback((e: any) => {
    // Handle spacebar panning first
    handleSpacebarMouseMove(e)
    
    // Then handle existing mouse move logic
    if (isPanning) {
      // Existing panning logic
    }
  }, [handleSpacebarMouseMove, isPanning, updatePan, onStageMouseMove])
  
  const handleMouseUp = useCallback((e: any) => {
    // Handle spacebar panning first
    handleSpacebarMouseUp(e)
    
    // Then handle existing mouse up logic
    if (isPanning) {
      // Existing panning logic
    }
  }, [handleSpacebarMouseUp, isPanning, endPan, onStageMouseUp])
  
  return (
    <div 
      style={{ 
        cursor: isSpacebarPressed ? 'grab' : (isPanning || isGesturing ? 'grabbing' : 'default')
      }}
    >
      {/* Existing canvas content */}
    </div>
  )
}
```

### **Phase 4: Object Visibility Constraints (1-2 days)**

#### **Task 4.1: Create Object Boundary System**
```typescript
// New file: frontend/src/utils/objectConstraints.ts
interface CanvasBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

class ObjectConstraintManager {
  static constrainObjectToCanvas(
    object: CanvasObject, 
    newProperties: any, 
    canvasBounds: CanvasBounds
  ): any {
    const constrainedProps = { ...newProperties }
    
    switch (object.object_type) {
      case 'rectangle':
        return this.constrainRectangle(constrainedProps, canvasBounds)
      case 'circle':
        return this.constrainCircle(constrainedProps, canvasBounds)
      case 'text':
        return this.constrainText(constrainedProps, canvasBounds)
      // ... other object types
    }
  }
  
  static constrainRectangle(props: any, bounds: CanvasBounds) {
    // Ensure rectangle stays within canvas bounds
    const minWidth = 10
    const minHeight = 10
    
    props.x = Math.max(bounds.minX, Math.min(props.x, bounds.maxX - props.width))
    props.y = Math.max(bounds.minY, Math.min(props.y, bounds.maxY - props.height))
    props.width = Math.max(minWidth, props.width)
    props.height = Math.max(minHeight, props.height)
    
    return props
  }
  
  static constrainCircle(props: any, bounds: CanvasBounds) {
    // Ensure circle stays within canvas bounds
    const minRadius = 5
    
    props.x = Math.max(bounds.minX + props.radius, Math.min(props.x, bounds.maxX - props.radius))
    props.y = Math.max(bounds.minY + props.radius, Math.min(props.y, bounds.maxY - props.radius))
    props.radius = Math.max(minRadius, props.radius)
    
    return props
  }
}
```

#### **Task 4.2: Integrate Constraints with Object Updates**
```typescript
// File: frontend/src/components/CanvasPage.tsx
// Add constraint checking to object updates:

const handleObjectResize = async (objectId: string, newProperties: any) => {
  const object = objects.find(obj => obj.id === objectId)
  if (!object) return
  
  // Get canvas bounds (considering zoom and pan)
  const canvasBounds = {
    minX: 0,
    minY: 0,
    maxX: window.innerWidth,
    maxY: window.innerHeight - 120 // Account for header
  }
  
  // Apply constraints
  const constrainedProperties = ObjectConstraintManager.constrainObjectToCanvas(
    object,
    newProperties,
    canvasBounds
  )
  
  // Update object with constrained properties
  if (idToken) {
    await socketService.updateObject(canvasId!, idToken, objectId, constrainedProperties)
  }
}

const handleObjectUpdatePosition = async (objectId: string, x: number, y: number) => {
  const object = objects.find(obj => obj.id === objectId)
  if (!object) return
  
  const newProperties = { ...object.properties, x, y }
  
  // Apply constraints
  const canvasBounds = {
    minX: 0,
    minY: 0,
    maxX: window.innerWidth,
    maxY: window.innerHeight - 120
  }
  
  const constrainedProperties = ObjectConstraintManager.constrainObjectToCanvas(
    object,
    newProperties,
    canvasBounds
  )
  
  if (idToken) {
    await socketService.updateObject(canvasId!, idToken, objectId, constrainedProperties)
  }
}
```

### **Phase 5: Integration and Testing (1-2 days)**

#### **Task 5.1: Update Object Rendering with Edge Detection**
```typescript
// File: frontend/src/components/CanvasPage.tsx
// Update object rendering to support edge detection:

const renderObject = (obj: CanvasObject) => {
  const props = obj.properties
  const isSelected = selectedObjectId === obj.id
  const isEditing = editingObjectId === obj.id
  const isHovered = hoveredObjectId === obj.id

  switch (obj.object_type) {
    case 'rectangle':
      return (
        <Group key={obj.id}>
          <Rect
            x={props.x}
            y={props.y}
            width={props.width}
            height={props.height}
            fill={props.fill}
            stroke={props.stroke}
            strokeWidth={props.strokeWidth}
            draggable={selectedTool.id === 'select' && !isEditing && !isEdgeResizing}
            onClick={() => handleObjectSelect(obj.id)}
            onDragEnd={(e) => handleObjectUpdatePosition(obj.id, e.target.x(), e.target.y())}
            onMouseEnter={() => setHoveredObjectId(obj.id)}
            onMouseLeave={() => setHoveredObjectId(null)}
            // Add edge detection support
            listening={selectedTool.id === 'select'}
          />
          <SelectionIndicator 
            object={obj} 
            isSelected={isSelected} 
            isHovered={isHovered && !isSelected} 
          />
          <ResizeHandles 
            object={obj} 
            isSelected={isSelected} 
            onResize={handleObjectResize}
            onCursorChange={handleCursorChange}
            onCursorReset={handleCursorReset}
          />
        </Group>
      )
    // ... other object types
  }
}
```

#### **Task 5.2: Add Visual Feedback for Edge Detection**
```typescript
// File: frontend/src/components/CanvasPage.tsx
// Add visual feedback for edge detection:

const renderEdgeDetection = () => {
  if (hoveredObjectId && selectedTool.id === 'select' && !isEdgeResizing) {
    const object = objects.find(obj => obj.id === hoveredObjectId)
    if (object) {
      return (
        <EdgeDetectionOverlay
          object={object}
          onEdgeDetected={(edgeType) => {
            // Visual feedback for edge detection
          }}
        />
      )
    }
  }
  return null
}

// Add to canvas rendering:
<ZoomableCanvas>
  {objects.map(renderObject)}
  {renderNewObject()}
  {renderCursors()}
  {renderEdgeDetection()}
  {pointerIndicator && (
    <PointerIndicator ... />
  )}
</ZoomableCanvas>
```

---

## **🎯 Success Criteria**

### **Feature 1: Cursor Detection for Object Edges**
- ✅ Cursor changes to appropriate resize arrow when hovering over object edges
- ✅ Edge detection works for all object types (rectangle, circle, text, shapes)
- ✅ Cursor changes are smooth and responsive
- ✅ No false positives when hovering over object centers

### **Feature 2: Object Resizing via Edge Detection**
- ✅ Click and drag on object edges resizes the object
- ✅ Resizing works for all object types
- ✅ Real-time updates during resize
- ✅ Proper constraint handling to prevent invalid sizes

### **Feature 3: Spacebar Panning**
- ✅ Pressing spacebar changes cursor to grab
- ✅ Spacebar + drag pans the canvas smoothly
- ✅ Panning works in all directions
- ✅ Visual feedback during panning

### **Feature 4: Object Visibility**
- ✅ Objects cannot be moved outside visible canvas area
- ✅ Objects cannot be resized to invalid dimensions
- ✅ Minimum size constraints are enforced
- ✅ Objects remain visible after resize operations

---

## **📊 Implementation Priority**

### **High Priority (Must Have)**
1. **Edge Detection System** - Core functionality for cursor changes
2. **Direct Edge Resizing** - Primary resize interaction method
3. **Spacebar Panning** - Essential navigation feature

### **Medium Priority (Should Have)**
1. **Object Visibility Constraints** - Prevents user confusion
2. **Visual Feedback** - Enhanced user experience
3. **Performance Optimization** - Smooth interactions

### **Low Priority (Nice to Have)**
1. **Advanced Edge Detection** - More sophisticated edge detection
2. **Customizable Thresholds** - User-configurable edge detection sensitivity
3. **Animation Effects** - Smooth transitions and feedback

---

## **🔧 Technical Dependencies**

### **Required Components**
- **Konva.js**: For canvas rendering and object manipulation
- **React Konva**: For React integration with Konva
- **Existing ResizeHandles**: For reference implementation
- **Existing CursorManager**: For cursor management

### **Required Hooks**
- **useCanvasZoom**: For pan and zoom functionality
- **useSpacebarPanning**: New hook for spacebar detection
- **useEdgeDetection**: New hook for edge detection logic

---

## **📈 Estimated Timeline**

- **Phase 1 (Edge Detection)**: 2-3 days
- **Phase 2 (Direct Edge Resizing)**: 2-3 days
- **Phase 3 (Spacebar Panning)**: 1-2 days
- **Phase 4 (Object Visibility)**: 1-2 days
- **Phase 5 (Integration & Testing)**: 1-2 days

**Total Estimated Time**: 7-12 days

---

## **🚀 Next Steps**

1. **Review this plan** with the development team
2. **Set up development environment** and branch
3. **Begin with Phase 1** - Edge detection system
4. **Test incrementally** after each phase
5. **Integrate with existing systems** carefully
6. **User testing** for interaction feel and responsiveness
7. **Performance optimization** for smooth interactions

---

This plan leverages the existing robust infrastructure while adding the missing pieces to create a complete, professional-grade canvas interaction system. The implementation builds upon the already excellent foundation of resize handles, cursor management, and pan/zoom functionality.

