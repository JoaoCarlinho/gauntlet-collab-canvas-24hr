# 🔧 Object Resizing & Cursor Edge Detection Plan

## 📋 Overview

This plan addresses two critical user experience improvements:
1. **Enhanced Object Resizing** - Ensure all objects on the canvas can be properly resized
2. **Smart Cursor Detection** - Change cursor to indicate when hovering over resizable edges

## 🎯 Current State Analysis

### ✅ **Existing Resizing Implementation**
- **ResizeHandles Component**: Already exists with basic functionality
- **Supported Objects**: Rectangle, Circle, Text objects
- **Handle Types**: 8 handles (corners + edges) for rectangles, 4 for circles
- **Resize Logic**: Implemented for basic shapes with minimum size constraints

### ⚠️ **Current Limitations**
1. **Missing Object Types**: Heart, star, diamond, line, arrow objects lack resize handles
2. **No Cursor Detection**: Cursor doesn't change when hovering over resize edges
3. **Limited Visual Feedback**: No indication of resizable areas
4. **Inconsistent Behavior**: Different objects have different resize capabilities

## 🎨 Design Requirements

### **Visual Design**
- **Resize Handles**: Small, visible handles on object edges and corners
- **Cursor Changes**: Appropriate cursor icons for different resize directions
- **Visual Feedback**: Clear indication of resizable areas
- **Consistent Styling**: Uniform appearance across all object types

### **Interaction Design**
- **Hover Detection**: Cursor changes when hovering over resize areas
- **Drag to Resize**: Smooth resizing with real-time feedback
- **Minimum Sizes**: Prevent objects from becoming too small
- **Proportional Resizing**: Maintain aspect ratios where appropriate

## 🛠️ Technical Implementation Plan

### **Phase 1: Enhanced Resize Handles System**

#### **1.1 Extend ResizeHandles Component**
```typescript
// Enhanced ResizeHandles with cursor detection
interface ResizeHandlesProps {
  object: CanvasObject
  isSelected: boolean
  onResize: (objectId: string, properties: any) => void
  onCursorChange?: (cursor: string) => void  // NEW
  onCursorReset?: () => void                 // NEW
}
```

#### **1.2 Add Support for New Object Types**
- **Heart**: 8 handles (corners + edges) with proportional resizing
- **Star**: 8 handles with center-point resizing
- **Diamond**: 8 handles with proportional resizing
- **Line**: 2 handles (start and end points)
- **Arrow**: 2 handles (start and end points) + arrow head scaling

#### **1.3 Implement Cursor Detection Logic**
```typescript
// Cursor detection for resize handles
const getCursorForHandle = (handleType: string): string => {
  switch (handleType) {
    case 'nw': case 'se': return 'nw-resize'
    case 'ne': case 'sw': return 'ne-resize'
    case 'n': case 's': return 'ns-resize'
    case 'e': case 'w': return 'ew-resize'
    default: return 'default'
  }
}
```

### **Phase 2: Cursor Management System**

#### **2.1 Create Cursor Manager**
```typescript
// src/utils/cursorManager.ts
class CursorManager {
  private currentCursor: string = 'default'
  private canvasElement: HTMLElement | null = null
  
  setCursor(cursor: string): void
  resetCursor(): void
  isResizeCursor(cursor: string): boolean
}
```

#### **2.2 Integrate with Canvas Events**
- **Mouse Enter**: Detect when entering resize handle area
- **Mouse Leave**: Reset cursor when leaving resize area
- **Mouse Move**: Update cursor based on handle type
- **Mouse Down**: Maintain cursor during resize operation

#### **2.3 Cursor States**
```typescript
enum CursorState {
  DEFAULT = 'default',
  MOVE = 'move',
  NW_RESIZE = 'nw-resize',
  NE_RESIZE = 'ne-resize',
  SW_RESIZE = 'sw-resize',
  SE_RESIZE = 'se-resize',
  N_RESIZE = 'ns-resize',
  S_RESIZE = 'ns-resize',
  E_RESIZE = 'ew-resize',
  W_RESIZE = 'ew-resize',
  CROSSHAIR = 'crosshair'
}
```

### **Phase 3: Object-Specific Resize Logic**

#### **3.1 Shape Objects (Heart, Star, Diamond)**
```typescript
const handleShapeResize = (props: any, handleType: string, deltaX: number, deltaY: number) => {
  const minSize = 20
  
  // Proportional resizing to maintain shape integrity
  switch (handleType) {
    case 'nw': // Top-left
      props.x += deltaX
      props.y += deltaY
      props.width = Math.max(minSize, props.width - deltaX)
      props.height = Math.max(minSize, props.height - deltaY)
      break
    // ... other cases
  }
}
```

#### **3.2 Line Objects (Line, Arrow)**
```typescript
const handleLineResize = (props: any, handleType: string, deltaX: number, deltaY: number) => {
  switch (handleType) {
    case 'start': // Start point
      props.points[0] += deltaX
      props.points[1] += deltaY
      break
    case 'end': // End point
      props.points[2] += deltaX
      props.points[3] += deltaY
      break
  }
}
```

#### **3.3 Arrow-Specific Logic**
```typescript
const handleArrowResize = (props: any, handleType: string, deltaX: number, deltaY: number) => {
  // Handle line resizing
  handleLineResize(props, handleType, deltaX, deltaY)
  
  // Update arrow head size based on line length
  const lineLength = Math.sqrt(
    Math.pow(props.points[2] - props.points[0], 2) + 
    Math.pow(props.points[3] - props.points[1], 2)
  )
  props.arrowHeadSize = Math.max(8, Math.min(20, lineLength * 0.1))
}
```

### **Phase 4: Enhanced Visual Feedback**

#### **4.1 Resize Handle Styling**
```typescript
const getHandleStyle = (handleType: string, isHovered: boolean) => ({
  fill: isHovered ? '#1d4ed8' : '#3b82f6',
  stroke: '#fff',
  strokeWidth: 1,
  radius: 4,
  opacity: isHovered ? 1 : 0.8
})
```

#### **4.2 Hover Effects**
- **Handle Highlighting**: Brighter color when hovering
- **Cursor Preview**: Show resize cursor before clicking
- **Visual Feedback**: Subtle animations for better UX

#### **4.3 Edge Detection Zones**
```typescript
const getEdgeDetectionZone = (object: CanvasObject, handleType: string) => {
  const zoneSize = 8 // pixels
  const props = object.properties
  
  switch (handleType) {
    case 'nw': return { x: props.x - zoneSize, y: props.y - zoneSize, width: zoneSize * 2, height: zoneSize * 2 }
    // ... other zones
  }
}
```

## 🎯 Implementation Steps

### **Step 1: Create Cursor Management System**
1. **Create CursorManager utility** (`src/utils/cursorManager.ts`)
2. **Define cursor states and types**
3. **Implement cursor change logic**
4. **Add cursor reset functionality**

### **Step 2: Enhance ResizeHandles Component**
1. **Add cursor detection props**
2. **Implement hover event handlers**
3. **Add cursor change callbacks**
4. **Update handle styling for hover states**

### **Step 3: Add Support for New Object Types**
1. **Extend getHandles() function** for new object types
2. **Implement resize logic** for each new object type
3. **Add handle positioning** for complex shapes
4. **Test resize behavior** for all object types

### **Step 4: Integrate with CanvasPage**
1. **Add cursor management state**
2. **Update mouse event handlers**
3. **Integrate cursor changes** with resize operations
4. **Add edge detection zones**

### **Step 5: Polish and Optimization**
1. **Add smooth animations**
2. **Optimize performance**
3. **Add accessibility features**
4. **Test cross-platform compatibility**

## 🧪 Testing Strategy

### **Functional Testing**
- [ ] All object types can be resized
- [ ] Cursor changes appropriately on hover
- [ ] Resize handles appear for selected objects
- [ ] Minimum size constraints work correctly
- [ ] Proportional resizing maintains shape integrity

### **Edge Case Testing**
- [ ] Very small objects (minimum size)
- [ ] Very large objects (performance)
- [ ] Rapid mouse movements
- [ ] Object boundaries and canvas edges
- [ ] Multiple objects selected

### **User Experience Testing**
- [ ] Intuitive cursor changes
- [ ] Smooth resize operations
- [ ] Clear visual feedback
- [ ] Consistent behavior across objects
- [ ] Performance with many objects

## 📊 Success Criteria

### **Functional Requirements**
- ✅ All 8 object types support resizing
- ✅ Cursor changes indicate resizable areas
- ✅ Resize handles are visible and functional
- ✅ Minimum size constraints prevent tiny objects
- ✅ Real-time visual feedback during resize

### **User Experience**
- ✅ Intuitive cursor behavior
- ✅ Clear visual indication of resizable areas
- ✅ Smooth resize operations
- ✅ Consistent behavior across all objects
- ✅ Professional, polished feel

### **Technical Requirements**
- ✅ TypeScript type safety
- ✅ Performance optimized
- ✅ Cross-platform compatible
- ✅ Accessible design
- ✅ Maintainable code structure

## 🚀 Future Enhancements

### **Advanced Features**
- **Proportional Resizing**: Hold Shift to maintain aspect ratio
- **Grid Snapping**: Snap to grid during resize
- **Multi-Object Resize**: Resize multiple selected objects
- **Keyboard Resize**: Arrow keys for precise resizing
- **Resize History**: Undo/redo resize operations

### **Accessibility**
- **Screen Reader Support**: Announce resize capabilities
- **Keyboard Navigation**: Tab through resize handles
- **High Contrast Mode**: Enhanced visibility
- **Voice Commands**: "Resize object to 100x50"

### **Performance Optimizations**
- **Handle Pooling**: Reuse handle elements
- **Lazy Rendering**: Only render handles for visible objects
- **Debounced Updates**: Optimize frequent resize events
- **Memory Management**: Clean up event listeners

This implementation will provide a professional, intuitive resizing experience that matches industry standards for design tools, making the canvas much more powerful and user-friendly.
