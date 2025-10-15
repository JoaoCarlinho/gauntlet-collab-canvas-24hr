import React from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  MousePointer2
} from 'lucide-react'

interface ZoomControlsProps {
  zoomPercentage: number
  isAtMinZoom: boolean
  isAtMaxZoom: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onFitToScreen: () => void
  onFitToContent: () => void
  className?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomPercentage,
  isAtMinZoom,
  isAtMaxZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  onFitToContent,
  className = '',
  position = 'bottom-right'
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4'
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'bottom-right':
      default:
        return 'bottom-4 right-4'
    }
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-30 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center space-x-1">
        {/* Zoom Out Button */}
        <button
          onClick={onZoomOut}
          disabled={isAtMinZoom}
          className={`p-2 rounded-md transition-colors ${
            isAtMinZoom
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Zoom Out (Ctrl + -)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom Level Display */}
        <div className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[60px] text-center">
          {zoomPercentage}%
        </div>

        {/* Zoom In Button */}
        <button
          onClick={onZoomIn}
          disabled={isAtMaxZoom}
          className={`p-2 rounded-md transition-colors ${
            isAtMaxZoom
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title="Zoom In (Ctrl + +)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Reset Zoom Button */}
        <button
          onClick={onResetZoom}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Reset Zoom (Ctrl + 0)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fit to Screen Button */}
        <button
          onClick={onFitToScreen}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Fit to Screen (Ctrl + 1)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Fit to Content Button */}
        <button
          onClick={onFitToContent}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title="Fit to Content"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom Instructions */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center space-x-1">
          <MousePointer2 className="w-3 h-3" />
          <span>Scroll to zoom • Drag to pan</span>
        </div>
      </div>
    </div>
  )
}

export default ZoomControls
