# 📋 **Implementation Tasks for Object Resizing and Panning**

## **Overview**
This document breaks down the implementation plan into specific, actionable tasks that can be completed step-by-step to implement the four requested features:

1. **Cursor Detection for Object Edges** - Change cursor to resize arrows when hovering over object edges
2. **Object Resizing** - Click and drag to resize objects when cursor is over edges  
3. **Spacebar Panning** - Press spacebar + drag to pan the canvas
4. **Object Visibility** - Ensure objects remain visible when moved/resized

---

## **Phase 1: Edge Detection and Cursor Management (2-3 days)**

### **Task 1.1: Create Edge Detection Utility**
**File**: `frontend/src/utils/edgeDetection.ts`
**Estimated Time**: 4-6 hours

**Requirements**:
- Create `EdgeDetector` class with static methods
- Implement `detectEdge()` method that takes mouse position, object, and threshold
- Support all object types: rectangle, circle, text, heart, star, diamond, line, arrow
- Return edge detection result with edge type and cursor
- Handle edge types: 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'

**Implementation Details**:
```typescript
interface EdgeDetectionResult {
  isNearEdge: boolean
  edgeType: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null
  distance: number
  cursor: string
}

class EdgeDetector {
  static detectEdge(mouseX: number, mouseY: number, object: CanvasObject, threshold: number = 10): EdgeDetectionResult
  static detectRectangleEdge(mouseX: number, mouseY: number, props: any, threshold: number): EdgeDetectionResult
  static detectCircleEdge(mouseX: number, mouseY: number, props: any, threshold: number): EdgeDetectionResult
  static detectTextEdge(mouseX: number, mouseY: number, props: any, threshold: number): EdgeDetectionResult
  static detectShapeEdge(mouseX: number, mouseY: number, props: any, threshold: number): EdgeDetectionResult
  static detectLineEdge(mouseX: number, mouseY: number, props: any, threshold: number): EdgeDetectionResult
}
```

**Acceptance Criteria**:
- [ ] Edge detection works for all object types
- [ ] Returns correct edge type and cursor for each edge
- [ ] Configurable threshold for edge detection sensitivity
- [ ] Handles edge cases (objects at canvas boundaries)
- [ ] Performance optimized (no unnecessary calculations)

### **Task 1.2: Update Cursor Manager**
**File**: `frontend/src/utils/cursorManager.ts`
**Estimated Time**: 2-3 hours

**Requirements**:
- Add `setEdgeCursor()` method to handle edge-based cursors
- Add edge cursor mapping for all resize directions
- Integrate with existing cursor management system
- Support cursor reset when leaving edge areas

**Implementation Details**:
```typescript
class CursorManager {
  setEdgeCursor(edgeType: string): void
  getCursorForEdge(edgeType: string): string
  // Existing methods remain unchanged
}
```

**Acceptance Criteria**:
- [ ] Edge cursors are properly mapped to CSS cursor values
- [ ] Cursor changes are smooth and immediate
- [ ] Cursor resets properly when leaving edge areas
- [ ] Integrates with existing cursor management

### **Task 1.3: Integrate Edge Detection with Canvas Mouse Events**
**File**: `frontend/src/components/CanvasPage.tsx`
**Estimated Time**: 3-4 hours

**Requirements**:
- Add edge detection to `handleStageMouseMove`
- Update cursor based on edge detection results
- Only activate when select tool is active
- Handle multiple objects and find closest edge

**Implementation Details**:
```typescript
const handleStageMouseMove = (e: any) => {
  const stage = e.target.getStage()
  const pointerPosition = stage.getPointerPosition()
  
  if (selectedTool.id === 'select') {
    // Find object under cursor
    const objectUnderCursor = findObjectAtPosition(pointerPosition.x, pointerPosition.y)
    
    if (objectUnderCursor) {
      const edgeResult = EdgeDetector.detectEdge(
        pointerPosition.x, 
        pointerPosition.y, 
        objectUnderCursor
      )
      
      if (edgeResult.isNearEdge) {
        cursorManager.setEdgeCursor(edgeResult.edgeType)
      } else {
        cursorManager.resetCursor()
      }
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Edge detection activates only with select tool
- [ ] Cursor changes immediately when hovering over edges
- [ ] Cursor resets when leaving object edges
- [ ] Works with all object types
- [ ] Performance is smooth (no lag)

---

## **Phase 2: Direct Edge Resizing (2-3 days)**

### **Task 2.1: Create Edge Resize Calculation Functions**
**File**: `frontend/src/utils/edgeResizeCalculations.ts`
**Estimated Time**: 6-8 hours

**Requirements**:
- Create resize calculation functions for each object type
- Handle all edge types (n, s, e, w, ne, nw, se, sw)
- Maintain object proportions where appropriate
- Apply minimum size constraints

**Implementation Details**:
```typescript
class EdgeResizeCalculator {
  static calculateRectangleEdgeResize(props: any, edgeType: string, deltaX: number, deltaY: number): any
  static calculateCircleEdgeResize(props: any, edgeType: string, deltaX: number, deltaY: number): any
  static calculateTextEdgeResize(props: any, edgeType: string, deltaX: number, deltaY: number): any
  static calculateShapeEdgeResize(props: any, edgeType: string, deltaX: number, deltaY: number): any
  static calculateLineEdgeResize(props: any, edgeType: string, deltaX: number, deltaY: number): any
}
```

**Acceptance Criteria**:
- [ ] All object types support edge resizing
- [ ] Resize calculations are mathematically correct
- [ ] Minimum size constraints are enforced
- [ ] Object proportions are maintained where appropriate
- [ ] Edge cases are handled (very small objects, etc.)

### **Task 2.2: Add Edge Resize State Management**
**File**: `frontend/src/components/CanvasPage.tsx`
**Estimated Time**: 2-3 hours

**Requirements**:
- Add state for edge resizing mode
- Track edge resize data (object, edge type, start position)
- Handle edge resize start, update, and end

**Implementation Details**:
```typescript
// Add to CanvasPage state
const [isEdgeResizing, setIsEdgeResizing] = useState(false)
const [edgeResizeData, setEdgeResizeData] = useState<{
  objectId: string
  edgeType: string
  startPos: {x: number, y: number}
  startProperties: any
} | null>(null)
```

**Acceptance Criteria**:
- [ ] Edge resize state is properly managed
- [ ] State is reset when resize operation ends
- [ ] No memory leaks or stale state
- [ ] State updates are efficient

### **Task 2.3: Implement Edge Resize Mouse Handlers**
**File**: `frontend/src/components/CanvasPage.tsx`
**Estimated Time**: 4-5 hours

**Requirements**:
- Update `handleStageMouseDown` to detect edge resize start
- Update `handleStageMouseMove` to handle edge resize updates
- Update `handleStageMouseUp` to end edge resize
- Integrate with existing mouse event handling

**Implementation Details**:
```typescript
const handleStageMouseDown = (e: any) => {
  if (selectedTool.id === 'select') {
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    // Check for edge detection
    const objectUnderCursor = findObjectAtPosition(pointerPosition.x, pointerPosition.y)
    if (objectUnderCursor) {
      const edgeResult = EdgeDetector.detectEdge(pointerPosition.x, pointerPosition.y, objectUnderCursor)
      
      if (edgeResult.isNearEdge) {
        setIsEdgeResizing(true)
        setEdgeResizeData({
          objectId: objectUnderCursor.id,
          edgeType: edgeResult.edgeType,
          startPos: pointerPosition,
          startProperties: { ...objectUnderCursor.properties }
        })
        e.evt.preventDefault()
        return
      }
    }
  }
  
  // Existing mouse down logic
}

const handleStageMouseMove = (e: any) => {
  if (isEdgeResizing && edgeResizeData) {
    const stage = e.target.getStage()
    const pointerPosition = stage.getPointerPosition()
    
    const deltaX = pointerPosition.x - edgeResizeData.startPos.x
    const deltaY = pointerPosition.y - edgeResizeData.startPos.y
    
    const newProperties = EdgeResizeCalculator.calculateEdgeResize(
      edgeResizeData.startProperties,
      edgeResizeData.edgeType,
      deltaX,
      deltaY
    )
    
    handleObjectResize(edgeResizeData.objectId, newProperties)
  } else {
    // Existing mouse move logic (including edge detection)
  }
}

const handleStageMouseUp = (e: any) => {
  if (isEdgeResizing) {
    setIsEdgeResizing(false)
    setEdgeResizeData(null)
  }
  
  // Existing mouse up logic
}
```

**Acceptance Criteria**:
- [ ] Edge resize starts when clicking on object edges
- [ ] Resize updates in real-time during drag
- [ ] Resize ends properly when mouse is released
- [ ] No conflicts with existing mouse event handling
- [ ] Works with all object types

### **Task 2.4: Update Object Rendering for Edge Resize**
**File**: `frontend/src/components/CanvasPage.tsx`
**Estimated Time**: 2-3 hours

**Requirements**:
- Disable object dragging when edge resizing
- Ensure objects remain interactive during edge resize
- Update object event handlers

**Implementation Details**:
```typescript
const renderObject = (obj: CanvasObject) => {
  const isSelected = selectedObjectId === obj.id
  const isEditing = editingObjectId === obj.id
  const isHovered = hoveredObjectId === obj.id
  const isCurrentlyResizing = isEdgeResizing && edgeResizeData?.objectId === obj.id

  switch (obj.object_type) {
    case 'rectangle':
      return (
        <Group key={obj.id}>
          <Rect
            // ... existing props
            draggable={selectedTool.id === 'select' && !isEditing && !isCurrentlyResizing}
            // ... other props
          />
          {/* ... existing components */}
        </Group>
      )
    // ... other object types
  }
}
```

**Acceptance Criteria**:
- [ ] Objects are not draggable during edge resize
- [ ] Edge resize takes precedence over object dragging
- [ ] Visual feedback is appropriate during resize
- [ ] No conflicts with existing object interactions

---

## **Phase 3: Spacebar Panning (1-2 days)**

### **Task 3.1: Create Spacebar Panning Hook**
**File**: `frontend/src/hooks/useSpacebarPanning.ts`
**Estimated Time**: 4-5 hours

**Requirements**:
- Create custom hook for spacebar detection
- Handle spacebar press/release events
- Integrate with existing pan functionality
- Provide mouse event handlers

**Implementation Details**:
```typescript
interface UseSpacebarPanningProps {
  onStartPan: (x: number, y: number) => void
  onUpdatePan: (x: number, y: number) => void
  onEndPan: () => void
}

export const useSpacebarPanning = ({ onStartPan, onUpdatePan, onEndPan }: UseSpacebarPanningProps) => {
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  
  // Keyboard event handlers
  // Mouse event handlers
  // Return interface
}
```

**Acceptance Criteria**:
- [ ] Spacebar press/release is detected reliably
- [ ] No conflicts with other keyboard shortcuts
- [ ] Mouse events are properly handled
- [ ] Hook is reusable and well-typed
- [ ] Performance is optimized

### **Task 3.2: Integrate Spacebar Panning with ZoomableCanvas**
**File**: `frontend/src/components/ZoomableCanvas.tsx`
**Estimated Time**: 3-4 hours

**Requirements**:
- Integrate spacebar panning hook
- Update mouse event handlers
- Add visual feedback for spacebar panning
- Ensure no conflicts with existing panning

**Implementation Details**:
```typescript
const ZoomableCanvas: React.FC<ZoomableCanvasProps> = ({ ... }) => {
  const { startPan, updatePan, endPan } = useCanvasZoom()
  
  const {
    isSpacebarPressed,
    isPanning: isSpacebarPanning,
    handleMouseDown: handleSpacebarMouseDown,
    handleMouseMove: handleSpacebarMouseMove,
    handleMouseUp: handleSpacebarMouseUp
  } = useSpacebarPanning({ startPan, updatePan, endPan })
  
  // Update existing mouse handlers to integrate spacebar panning
  // Update cursor styling
  // Add visual feedback
}
```

**Acceptance Criteria**:
- [ ] Spacebar + drag pans the canvas
- [ ] Cursor changes to grab when spacebar is pressed
- [ ] No conflicts with existing panning methods
- [ ] Visual feedback is clear and consistent
- [ ] Performance is smooth

### **Task 3.3: Add Spacebar Panning Visual Feedback**
**File**: `frontend/src/components/ZoomableCanvas.tsx`
**Estimated Time**: 1-2 hours

**Requirements**:
- Add cursor changes for spacebar panning
- Add visual indicators during panning
- Ensure consistent user experience

**Implementation Details**:
```typescript
// Update cursor styling
style={{ 
  cursor: isSpacebarPressed ? 'grab' : (isPanning || isGesturing ? 'grabbing' : 'default')
}}

// Add panning indicator
{isSpacebarPanning && (
  <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
    Panning with spacebar...
  </div>
)}
```

**Acceptance Criteria**:
- [ ] Cursor changes appropriately for spacebar panning
- [ ] Visual feedback is clear and helpful
- [ ] Consistent with existing panning feedback
- [ ] No visual glitches or conflicts

---

## **Phase 4: Object Visibility Constraints (1-2 days)**

### **Task 4.1: Create Object Constraint Manager**
**File**: `frontend/src/utils/objectConstraints.ts`
**Estimated Time**: 4-5 hours

**Requirements**:
- Create constraint system for all object types
- Define minimum sizes and boundaries
- Handle canvas bounds calculation
- Support zoom and pan considerations

**Implementation Details**:
```typescript
interface CanvasBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface ObjectConstraints {
  minWidth: number
  minHeight: number
  minRadius: number
  // ... other constraints
}

class ObjectConstraintManager {
  static constrainObjectToCanvas(object: CanvasObject, newProperties: any, canvasBounds: CanvasBounds): any
  static constrainRectangle(props: any, bounds: CanvasBounds, constraints: ObjectConstraints): any
  static constrainCircle(props: any, bounds: CanvasBounds, constraints: ObjectConstraints): any
  static constrainText(props: any, bounds: CanvasBounds, constraints: ObjectConstraints): any
  static constrainShape(props: any, bounds: CanvasBounds, constraints: ObjectConstraints): any
  static constrainLine(props: any, bounds: CanvasBounds, constraints: ObjectConstraints): any
}
```

**Acceptance Criteria**:
- [ ] All object types have appropriate constraints
- [ ] Minimum sizes are enforced
- [ ] Objects cannot be moved outside canvas bounds
- [ ] Constraints work with zoom and pan
- [ ] Performance is optimized

### **Task 4.2: Integrate Constraints with Object Updates**
**File**: `frontend/src/components/CanvasPage.tsx`
**Estimated Time**: 3-4 hours

**Requirements**:
- Apply constraints to all object updates
- Calculate canvas bounds dynamically
- Handle resize and move operations
- Provide user feedback for constraint violations

**Implementation Details**:
```typescript
const getCanvasBounds = (): CanvasBounds => {
  // Calculate bounds considering zoom and pan
  return {
    minX: 0,
    minY: 0,
    maxX: window.innerWidth,
    maxY: window.innerHeight - 120 // Account for header
  }
}

const handleObjectResize = async (objectId: string, newProperties: any) => {
  const object = objects.find(obj => obj.id === objectId)
  if (!object) return
  
  const canvasBounds = getCanvasBounds()
  const constrainedProperties = ObjectConstraintManager.constrainObjectToCanvas(
    object,
    newProperties,
    canvasBounds
  )
  
  // Check if constraints were applied
  if (JSON.stringify(constrainedProperties) !== JSON.stringify(newProperties)) {
    // Provide user feedback
    toast.info('Object constrained to canvas bounds')
  }
  
  if (idToken) {
    await socketService.updateObject(canvasId!, idToken, objectId, constrainedProperties)
  }
}
```

**Acceptance Criteria**:
- [ ] Constraints are applied to all object updates
- [ ] Canvas bounds are calculated correctly
- [ ] User feedback is provided when constraints are applied
- [ ] No objects can disappear from canvas
- [ ] Performance impact is minimal

### **Task 4.3: Add Constraint Configuration**
**File**: `frontend/src/config/objectConstraints.ts`
**Estimated Time**: 1-2 hours

**Requirements**:
- Define default constraints for all object types
- Make constraints configurable
- Support different constraint profiles

**Implementation Details**:
```typescript
export const DEFAULT_CONSTRAINTS: ObjectConstraints = {
  rectangle: {
    minWidth: 10,
    minHeight: 10
  },
  circle: {
    minRadius: 5
  },
  text: {
    minWidth: 20,
    minHeight: 15
  },
  // ... other object types
}

export const STRICT_CONSTRAINTS: ObjectConstraints = {
  // More restrictive constraints
}

export const RELAXED_CONSTRAINTS: ObjectConstraints = {
  // Less restrictive constraints
}
```

**Acceptance Criteria**:
- [ ] Default constraints are reasonable
- [ ] Constraints are easily configurable
- [ ] Different constraint profiles are available
- [ ] Configuration is well-documented

---

## **Phase 5: Integration and Testing (1-2 days)**

### **Task 5.1: Update Object Rendering Integration**
**File**: `frontend/src/components/CanvasPage.tsx`
**Estimated Time**: 2-3 hours

**Requirements**:
- Integrate all new features with existing object rendering
- Ensure no conflicts between features
- Update event handling order
- Test all interaction combinations

**Implementation Details**:
```typescript
const renderObject = (obj: CanvasObject) => {
  const isSelected = selectedObjectId === obj.id
  const isEditing = editingObjectId === obj.id
  const isHovered = hoveredObjectId === obj.id
  const isCurrentlyResizing = isEdgeResizing && edgeResizeData?.objectId === obj.id

  // Update all object types with new interaction logic
  // Ensure proper event handling order
  // Add visual feedback for all states
}
```

**Acceptance Criteria**:
- [ ] All features work together without conflicts
- [ ] Event handling order is correct
- [ ] Visual feedback is consistent
- [ ] Performance is maintained

### **Task 5.2: Add Edge Detection Visual Overlay**
**File**: `frontend/src/components/EdgeDetectionOverlay.tsx`
**Estimated Time**: 2-3 hours

**Requirements**:
- Create visual overlay for edge detection
- Show edge indicators when hovering
- Provide visual feedback for resize operations
- Ensure overlay doesn't interfere with interactions

**Implementation Details**:
```typescript
interface EdgeDetectionOverlayProps {
  object: CanvasObject
  isVisible: boolean
  edgeType: string | null
  onEdgeDetected: (edgeType: string) => void
}

const EdgeDetectionOverlay: React.FC<EdgeDetectionOverlayProps> = ({
  object,
  isVisible,
  edgeType,
  onEdgeDetected
}) => {
  // Render edge indicators
  // Handle edge detection visual feedback
  // Ensure proper z-index and interaction
}
```

**Acceptance Criteria**:
- [ ] Edge indicators are visible and clear
- [ ] Overlay doesn't interfere with object interactions
- [ ] Visual feedback is helpful and not distracting
- [ ] Performance is optimized

### **Task 5.3: Comprehensive Testing**
**Estimated Time**: 4-6 hours

**Requirements**:
- Test all features individually
- Test feature combinations
- Test edge cases and error conditions
- Performance testing
- Cross-browser testing

**Test Cases**:
- [ ] Edge detection works for all object types
- [ ] Edge resizing works for all object types and edge directions
- [ ] Spacebar panning works in all directions
- [ ] Object constraints prevent objects from disappearing
- [ ] All features work together without conflicts
- [ ] Performance is smooth with many objects
- [ ] Works on different screen sizes
- [ ] Works with different zoom levels
- [ ] Keyboard shortcuts don't conflict
- [ ] Touch interactions work on mobile

**Acceptance Criteria**:
- [ ] All test cases pass
- [ ] No regressions in existing functionality
- [ ] Performance meets requirements
- [ ] User experience is smooth and intuitive

### **Task 5.4: Documentation and Cleanup**
**Estimated Time**: 2-3 hours

**Requirements**:
- Update component documentation
- Add JSDoc comments to new functions
- Clean up unused code
- Update type definitions

**Implementation Details**:
```typescript
/**
 * Detects if the mouse cursor is near an object edge
 * @param mouseX - X coordinate of mouse cursor
 * @param mouseY - Y coordinate of mouse cursor
 * @param object - Canvas object to check
 * @param threshold - Distance threshold for edge detection
 * @returns Edge detection result with edge type and cursor
 */
static detectEdge(mouseX: number, mouseY: number, object: CanvasObject, threshold: number = 10): EdgeDetectionResult
```

**Acceptance Criteria**:
- [ ] All new code is properly documented
- [ ] Type definitions are complete and accurate
- [ ] No unused code remains
- [ ] Code follows project conventions

---

## **📊 Task Summary**

| Phase | Task | Estimated Time | Priority |
|-------|------|----------------|----------|
| 1 | Edge Detection Utility | 4-6 hours | High |
| 1 | Update Cursor Manager | 2-3 hours | High |
| 1 | Integrate Edge Detection | 3-4 hours | High |
| 2 | Edge Resize Calculations | 6-8 hours | High |
| 2 | Edge Resize State Management | 2-3 hours | High |
| 2 | Edge Resize Mouse Handlers | 4-5 hours | High |
| 2 | Update Object Rendering | 2-3 hours | High |
| 3 | Spacebar Panning Hook | 4-5 hours | High |
| 3 | Integrate Spacebar Panning | 3-4 hours | High |
| 3 | Visual Feedback | 1-2 hours | Medium |
| 4 | Object Constraint Manager | 4-5 hours | High |
| 4 | Integrate Constraints | 3-4 hours | High |
| 4 | Constraint Configuration | 1-2 hours | Medium |
| 5 | Update Object Rendering | 2-3 hours | High |
| 5 | Edge Detection Overlay | 2-3 hours | Medium |
| 5 | Comprehensive Testing | 4-6 hours | High |
| 5 | Documentation and Cleanup | 2-3 hours | Medium |

**Total Estimated Time**: 50-75 hours (7-12 days)

---

## **🚀 Getting Started**

1. **Start with Phase 1, Task 1.1** - Create the edge detection utility
2. **Test incrementally** after each task
3. **Commit frequently** with descriptive messages
4. **Update this document** as tasks are completed
5. **Ask for help** if any task is unclear or blocked

Each task is designed to be completed independently while building toward the complete feature set. The modular approach allows for testing and validation at each step.

