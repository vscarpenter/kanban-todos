"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2
} from "@/lib/icons";
import { TaskAttachment } from "@/lib/types";
import { useTaskStore } from "@/lib/stores/taskStore";
import { getFileTypeInfo, formatFileSize } from "@/lib/utils/fileUtils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { initializePDFJS } from "@/lib/utils/pdfInit";

interface AttachmentModalViewerProps {
  attachment: TaskAttachment;
  attachments: TaskAttachment[];
  onClose: () => void;
  onAttachmentChange?: (attachment: TaskAttachment) => void;
}

export function AttachmentModalViewer({ 
  attachment, 
  attachments, 
  onClose, 
  onAttachmentChange 
}: AttachmentModalViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { downloadAttachment } = useTaskStore();

  const currentIndex = attachments.findIndex(a => a.id === attachment.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < attachments.length - 1;

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      const prevAttachment = attachments[currentIndex - 1];
      onAttachmentChange?.(prevAttachment);
    }
  }, [currentIndex, hasPrevious, attachments, onAttachmentChange]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      const nextAttachment = attachments[currentIndex + 1];
      onAttachmentChange?.(nextAttachment);
    }
  }, [currentIndex, hasNext, attachments, onAttachmentChange]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrevious) {
            handlePrevious();
          }
          break;
        case 'ArrowRight':
          if (hasNext) {
            handleNext();
          }
          break;
        case 'F11':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [attachment.id, hasPrevious, hasNext, onClose, handlePrevious, handleNext, toggleFullscreen]);

  const handleDownload = async () => {
    try {
      const blob = await downloadAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${attachment.originalName}`);
    } catch {
      toast.error('Failed to download attachment');
    }
  };


  const fileInfo = getFileTypeInfo(attachment.fileType);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "max-w-none max-h-none w-screen h-screen p-0 bg-black/90 backdrop-blur-sm border-0",
          isFullscreen ? "bg-black" : ""
        )}

      >
        <DialogTitle className="sr-only">
          {attachment.originalName} - {fileInfo.description}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Attachment viewer showing {attachment.originalName}, a {fileInfo.description} file. 
          {attachments.length > 1 && `Item ${currentIndex + 1} of ${attachments.length}.`}
          Use arrow keys to navigate, Escape to close.
        </DialogDescription>
        <div className="flex flex-col h-full">
          {/* Header */}
          <AttachmentViewerHeader
            attachment={attachment}
            currentIndex={currentIndex}
            totalCount={attachments.length}
            isFullscreen={isFullscreen}
            onClose={onClose}
            onPrevious={hasPrevious ? handlePrevious : undefined}
            onNext={hasNext ? handleNext : undefined}
            onDownload={handleDownload}
            onToggleFullscreen={toggleFullscreen}
          />

          {/* Content */}
           <div className="flex-1 flex items-center justify-center p-4 min-h-0">
             <AttachmentViewerContent attachment={attachment} />
           </div>

          {/* Footer */}
          {!isFullscreen && (
            <AttachmentViewerFooter attachment={attachment} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AttachmentViewerHeaderProps {
  attachment: TaskAttachment;
  currentIndex: number;
  totalCount: number;
  isFullscreen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onDownload: () => void;
  onToggleFullscreen: () => void;
}

function AttachmentViewerHeader({
  attachment,
  currentIndex,
  totalCount,
  isFullscreen,
  onClose,
  onPrevious,
  onNext,
  onDownload,
  onToggleFullscreen
}: AttachmentViewerHeaderProps) {
  const fileInfo = getFileTypeInfo(attachment.fileType);

  return (
    <div className={cn(
      "flex items-center justify-between p-3 md:p-4 bg-black/20 backdrop-blur-sm border-b border-white/10",
      isFullscreen && "bg-black/80"
    )}>
      {/* File Info */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 text-white text-xs">
              {fileInfo.description}
            </Badge>
            {totalCount > 1 && (
              <span className="text-xs md:text-sm text-white/70 whitespace-nowrap">
                {currentIndex + 1} of {totalCount}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 
              id="attachment-viewer-title"
              className="font-medium text-white truncate text-sm md:text-base" 
              title={attachment.originalName}
            >
              {attachment.originalName}
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation & Actions */}
      <div className="flex items-center gap-0.5 md:gap-1">
        {/* Previous/Next - Hide on small screens if more than 3 actions */}
        {totalCount > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 w-8 p-0 md:h-auto md:w-auto md:px-2"
              onClick={onPrevious}
              disabled={!onPrevious}
              title="Previous (←)"
              aria-label="Previous attachment"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-1">Prev</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 w-8 p-0 md:h-auto md:w-auto md:px-2"
              onClick={onNext}
              disabled={!onNext}
              title="Next (→)"
              aria-label="Next attachment"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-1">Next</span>
            </Button>
          </>
        )}

        {/* Actions */}
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
          onClick={onDownload}
          title="Download"
          aria-label="Download attachment"
        >
          <Download className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0 hidden md:flex"
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen (F11)"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-8 w-8 p-0"
          onClick={onClose}
          title="Close (Esc)"
          aria-label="Close attachment viewer"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface AttachmentViewerContentProps {
  attachment: TaskAttachment;
}

function AttachmentViewerContent({ attachment }: AttachmentViewerContentProps) {
  const fileInfo = getFileTypeInfo(attachment.fileType);

  // Route to appropriate viewer based on file type
  switch (fileInfo.category) {
    case 'image':
      return <ImageViewer attachment={attachment} />;
    case 'pdf':
      return <PDFViewer attachment={attachment} />;
    case 'video':
      return <VideoViewer attachment={attachment} />;
    case 'audio':
      return <AudioViewer attachment={attachment} />;
    case 'code':
      return <TextViewer attachment={attachment} />;
    default:
      return <GenericViewer attachment={attachment} />;
  }
}

function AttachmentViewerFooter({ attachment }: { attachment: TaskAttachment }) {
  return (
    <div className="p-3 md:p-4 bg-black/20 backdrop-blur-sm border-t border-white/10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs md:text-sm text-white/70">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <span>{formatFileSize(attachment.fileSize)}</span>
          {attachment.metadata?.width && attachment.metadata?.height && (
            <span className="whitespace-nowrap">{attachment.metadata.width} × {attachment.metadata.height}</span>
          )}
          {attachment.metadata?.pageCount && (
            <span className="whitespace-nowrap">{attachment.metadata.pageCount} pages</span>
          )}
        </div>
        <div className="text-right">
          <span className="whitespace-nowrap">{new Date(attachment.uploadedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// Placeholder viewer components - will be implemented in next steps

function ImageViewer({ attachment }: AttachmentViewerContentProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'actual'>('contain');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { downloadAttachment } = useTaskStore();

  // Get image source - prefer thumbnail for initial load, then full resolution
  const [imageSrc, setImageSrc] = useState(attachment.thumbnail || '');
  
  useEffect(() => {
    // Load full resolution image after thumbnail
    if (attachment.thumbnail) {
      const loadFullImage = async () => {
        try {
          const blob = await downloadAttachment(attachment.id);
          const url = URL.createObjectURL(blob);
          setImageSrc(url);
        } catch (error) {
          console.warn('Failed to load full image:', error);
        }
      };
      
      if (imageLoaded) {
        loadFullImage();
      }
    }
  }, [attachment.id, attachment.thumbnail, downloadAttachment, imageLoaded]);

  // Reset view when attachment changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setFitMode('contain');
    setImageLoaded(false);
    setImageError(false);
    setImageSrc(attachment.thumbnail || '');
  }, [attachment.id, attachment.thumbnail]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setFitMode('contain');
  }, []);

  // Keyboard shortcuts for image viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          handleRotate();
          break;
        case '0':
          e.preventDefault();
          handleReset();
          break;
        case '1':
          e.preventDefault();
          setFitMode('actual');
          break;
        case '2':
          e.preventDefault();
          setFitMode('contain');
          break;
        case '3':
          e.preventDefault();
          setFitMode('cover');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleRotate, handleReset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.deltaY > 0) {
      handleZoomOut();
    } else {
      handleZoomIn();
    }
  }, [handleZoomIn, handleZoomOut]);

  const getImageStyle = () => {
    const transform = [
      `scale(${zoom})`,
      `rotate(${rotation}deg)`,
      `translate(${position.x}px, ${position.y}px)`
    ].join(' ');

    const style: React.CSSProperties = {
      transform,
      cursor: isDragging ? 'grabbing' : 'grab',
      maxWidth: fitMode === 'actual' ? 'none' : '100%',
      maxHeight: fitMode === 'actual' ? 'none' : '100%',
      width: fitMode === 'cover' ? '100%' : 'auto',
      height: fitMode === 'cover' ? '100%' : 'auto',
      objectFit: fitMode === 'cover' ? 'cover' : 'contain',
    };

    return style;
  };

  if (imageError) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-lg mb-2">Failed to load image</p>
          <p className="text-sm text-white/70">{attachment.originalName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Image Controls */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex items-center gap-1 md:gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 md:p-2 max-w-[calc(100vw-1rem)]">
        {/* Mobile: Simplified controls */}
        <div className="flex md:hidden items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-7 w-7 p-0"
            onClick={handleZoomOut}
            disabled={zoom <= 0.1}
            title="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          
          <span className="text-white text-xs px-1 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-7 w-7 p-0"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            title="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-7 w-7 p-0"
            onClick={handleRotate}
            title="Rotate"
          >
            <RotateCw className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-7 px-2 text-xs"
            onClick={handleReset}
            title="Reset"
          >
            Reset
          </Button>
        </div>

        {/* Desktop: Full controls */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-8 w-8 p-0"
            onClick={handleZoomOut}
            disabled={zoom <= 0.1}
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-white text-sm px-2 min-w-[4rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-8 w-8 p-0"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-white/20" />
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-8 w-8 p-0"
            onClick={handleRotate}
            title="Rotate (R)"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-white/20" />
          
          {/* Fit Mode Buttons */}
          <div className="flex gap-1">
            <Button
              variant={fitMode === 'actual' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "text-white h-8 px-2 text-xs",
                fitMode === 'actual' ? 'bg-white/20' : 'hover:bg-white/10'
              )}
              onClick={() => setFitMode('actual')}
              title="Actual Size (1)"
            >
              1:1
            </Button>
            <Button
              variant={fitMode === 'contain' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                "text-white h-8 px-2 text-xs",
                fitMode === 'contain' ? 'bg-white/20' : 'hover:bg-white/10'
              )}
              onClick={() => setFitMode('contain')}
              title="Fit to Screen (2)"
            >
              Fit
            </Button>
          </div>
          
          <div className="w-px h-6 bg-white/20" />
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 h-8 px-2 text-xs"
            onClick={handleReset}
            title="Reset View (0)"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Image Container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {imageSrc && (
          <img
            ref={imageRef}
            src={imageSrc}
            alt={attachment.originalName}
            className="select-none transition-opacity duration-200"
            style={getImageStyle()}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            draggable={false}
          />
        )}
        
        {!imageLoaded && !imageError && (
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading image...</p>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 text-white/50 text-xs bg-black/30 backdrop-blur-sm rounded px-2 py-1 max-w-[calc(100vw-1rem)]">
        <span className="hidden md:inline">
          Mouse: drag to pan, wheel to zoom • Keys: +/- zoom, R rotate, 0 reset
        </span>
        <span className="md:hidden">
          Touch: pinch to zoom, drag to pan
        </span>
      </div>
    </div>
  );
}

interface PDFViewport {
  width: number;
  height: number;
}

interface PDFRenderContext {
  canvasContext: CanvasRenderingContext2D;
  viewport: PDFViewport;
}

interface PDFPage {
  getViewport: (options: { scale: number }) => PDFViewport;
  render: (context: PDFRenderContext) => { promise: Promise<void> };
  cleanup: () => void;
}

interface PDFDocument {
  getPage: (pageNumber: number) => Promise<PDFPage>;
  numPages: number;
  destroy: () => void;
}

function PDFViewer({ attachment }: AttachmentViewerContentProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [renderedPages, setRenderedPages] = useState<Map<number, string>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { downloadAttachment } = useTaskStore();

  // Load PDF document
  useEffect(() => {
    let isMounted = true;
    
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const blob = await downloadAttachment(attachment.id);
        const arrayBuffer = await blob.arrayBuffer();
        
        // Initialize PDF.js with proper worker setup
        const pdfjsLib = await initializePDFJS();
        
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (isMounted) {
          setPdfDoc(pdf as unknown as PDFDocument);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load PDF');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPDF();
    
    return () => {
      isMounted = false;
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [attachment.id, downloadAttachment]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const viewport = page.getViewport({ scale: zoom });
        
        const canvas = canvasRef.current;
        if (!canvas) {
          console.warn('Canvas ref is null during page rendering');
          return;
        }
        
        const context = canvas.getContext('2d');
        if (!context) {
          console.error('Failed to get 2D context from canvas');
          return;
        }
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        
        // Clean up page
        page.cleanup();
      } catch (err) {
        console.error('Error rendering PDF page:', err);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom]);

  // Keyboard shortcuts for PDF viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          handlePreviousPage();
          break;
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          handleNextPage();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          break;
        case 'Home':
          e.preventDefault();
          setCurrentPage(1);
          break;
        case 'End':
          e.preventDefault();
          setCurrentPage(totalPages);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  }, []);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-lg mb-2">Failed to load PDF</p>
          <p className="text-sm text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* PDF Controls */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex items-center gap-1 md:gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 md:p-2 max-w-[calc(100vw-1rem)] overflow-x-auto">
        {/* Page Navigation */}
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-7 w-7 md:h-8 md:w-8 p-0"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          title="Previous Page (↑)"
        >
          <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        
        <div className="flex items-center gap-1 md:gap-2 text-white text-xs md:text-sm">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="w-10 md:w-12 px-0.5 md:px-1 py-0.5 text-center bg-white/10 border border-white/20 rounded text-white text-xs"
            min={1}
            max={totalPages}
          />
          <span className="text-white/70 whitespace-nowrap">of {totalPages}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-7 w-7 md:h-8 md:w-8 p-0"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          title="Next Page (↓)"
        >
          <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        
        <div className="w-px h-6 bg-white/20" />
        
        {/* Zoom Controls */}
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-7 w-7 md:h-8 md:w-8 p-0"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        
        <span className="text-white text-xs md:text-sm px-1 md:px-2 min-w-[3rem] md:min-w-[4rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-7 w-7 md:h-8 md:w-8 p-0"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          title="Zoom In (+)"
        >
          <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        
        <div className="w-px h-4 md:h-6 bg-white/20" />
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-7 md:h-8 px-1.5 md:px-2 text-xs"
          onClick={() => setZoom(1)}
          title="Reset Zoom (0)"
        >
          Reset
        </Button>
      </div>

      {/* PDF Content */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-2 md:p-4">
        <div className="bg-white shadow-2xl max-w-full max-h-full">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ 
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 text-white/50 text-xs bg-black/30 backdrop-blur-sm rounded px-2 py-1 max-w-[calc(100vw-1rem)]">
        <span className="hidden md:inline">
          Keys: ↑/↓ pages, +/- zoom, Home/End first/last page
        </span>
        <span className="md:hidden">
          Swipe or use controls to navigate
        </span>
      </div>
    </div>
  );
}

function VideoViewer({ attachment }: AttachmentViewerContentProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { downloadAttachment } = useTaskStore();

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const blob = await downloadAttachment(attachment.id);
        const url = URL.createObjectURL(blob);
        setVideoSrc(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();

    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [attachment.id, downloadAttachment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !videoSrc) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-lg mb-2">Failed to load video</p>
          <p className="text-sm text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full w-full">
      <video
        controls
        className="max-w-full max-h-full"
        preload="metadata"
        style={{ maxWidth: '90%', maxHeight: '90%' }}
      >
        <source src={videoSrc} type={attachment.fileType} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function AudioViewer({ attachment }: AttachmentViewerContentProps) {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { downloadAttachment } = useTaskStore();

  useEffect(() => {
    const loadAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const blob = await downloadAttachment(attachment.id);
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audio');
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [attachment.id, downloadAttachment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading audio...</p>
        </div>
      </div>
    );
  }

  if (error || !audioSrc) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-lg mb-2">Failed to load audio</p>
          <p className="text-sm text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center">
        <div className="mb-8 text-6xl">🎵</div>
        <h3 className="text-lg font-medium text-white mb-4">{attachment.originalName}</h3>
        <audio
          controls
          preload="metadata"
          className="w-full max-w-md"
        >
          <source src={audioSrc} type={attachment.fileType} />
          Your browser does not support the audio tag.
        </audio>
      </div>
    </div>
  );
}

function TextViewer({ attachment }: AttachmentViewerContentProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [wrapText, setWrapText] = useState(true);
  const { downloadAttachment } = useTaskStore();

  useEffect(() => {
    const loadText = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const blob = await downloadAttachment(attachment.id);
        const text = await blob.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load text file');
      } finally {
        setIsLoading(false);
      }
    };

    loadText();
  }, [attachment.id, downloadAttachment]);

  // Get language for syntax highlighting based on file extension or mime type
  const getLanguage = () => {
    const ext = attachment.originalName.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'fish': 'bash'
    };

    return languageMap[ext || ''] || 'plaintext';
  };

  const handleFontSizeChange = (delta: number) => {
    setFontSize(prev => Math.max(8, Math.min(24, prev + delta)));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading text...</p>
        </div>
      </div>
    );
  }

  if (error || content === null) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center text-white">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-lg mb-2">Failed to load text file</p>
          <p className="text-sm text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Text Controls */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 z-10 flex items-center gap-1 md:gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 md:p-2 max-w-[calc(100vw-1rem)]">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-7 md:h-8 px-1.5 md:px-2 text-xs"
          onClick={() => handleFontSizeChange(-1)}
          disabled={fontSize <= 8}
          title="Decrease Font Size"
        >
          A-
        </Button>
        
        <span className="text-white text-xs md:text-sm px-1 md:px-2 min-w-[2.5rem] md:min-w-[3rem] text-center">
          {fontSize}px
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10 h-7 md:h-8 px-1.5 md:px-2 text-xs"
          onClick={() => handleFontSizeChange(1)}
          disabled={fontSize >= 24}
          title="Increase Font Size"
        >
          A+
        </Button>
        
        <div className="w-px h-4 md:h-6 bg-white/20" />
        
        <Button
          variant={wrapText ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            "text-white h-7 md:h-8 px-1.5 md:px-2 text-xs",
            wrapText ? 'bg-white/20' : 'hover:bg-white/10'
          )}
          onClick={() => setWrapText(!wrapText)}
          title="Toggle Word Wrap"
        >
          Wrap
        </Button>
      </div>

      {/* Text Content */}
      <div className="flex-1 overflow-auto p-2 pt-12 md:p-4 md:pt-16">
        <div className="bg-gray-900 rounded-lg border border-gray-700 min-h-full">
          <pre
            className={cn(
              "p-2 md:p-4 text-gray-100 font-mono leading-relaxed",
              wrapText ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"
            )}
            style={{ fontSize: `${fontSize}px` }}
          >
            <code>{content}</code>
          </pre>
        </div>
      </div>

      {/* Help Text */}
      <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 text-white/50 text-xs bg-black/30 backdrop-blur-sm rounded px-2 py-1 max-w-[calc(100vw-1rem)]">
        <span className="block md:inline">Language: {getLanguage()}</span>
        <span className="hidden md:inline"> • </span>
        <span className="block md:inline">Lines: {content.split('\n').length}</span>
      </div>
    </div>
  );
}

function GenericViewer({ attachment }: AttachmentViewerContentProps) {
  const fileInfo = getFileTypeInfo(attachment.fileType);
  const { downloadAttachment } = useTaskStore();

  const handleDownload = async () => {
    try {
      const blob = await downloadAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${attachment.originalName}`);
    } catch {
      toast.error('Failed to download attachment');
    }
  };
  
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center text-white max-w-md">
        {/* File Icon */}
        <div className="mb-6 text-6xl">📎</div>
        
        {/* File Info */}
        <h3 className="text-xl font-medium mb-2" title={attachment.originalName}>
          {attachment.originalName.length > 40 
            ? `${attachment.originalName.substring(0, 37)}...` 
            : attachment.originalName
          }
        </h3>
        
        <div className="space-y-2 mb-6 text-white/70">
          <p className="text-lg">{fileInfo.description}</p>
          <p className="text-sm">{formatFileSize(attachment.fileSize)}</p>
          
          {/* Extended Metadata */}
          <div className="space-y-1 text-xs">
            <p>Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString()}</p>
            {attachment.metadata?.pageCount && (
              <p>Pages: {attachment.metadata.pageCount}</p>
            )}
            {attachment.metadata?.width && attachment.metadata?.height && (
              <p>Dimensions: {attachment.metadata.width} × {attachment.metadata.height}</p>
            )}
            {attachment.metadata?.description && (
              <p className="mt-2 text-white/50 italic">&ldquo;{attachment.metadata.description}&rdquo;</p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="space-y-3">
          <p className="text-sm text-white/50">
            This file type cannot be previewed in the browser.
          </p>
          
          <Button
            onClick={handleDownload}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        </div>
      </div>
    </div>
  );
}