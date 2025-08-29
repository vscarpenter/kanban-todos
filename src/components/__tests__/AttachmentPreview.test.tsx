import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AttachmentPreview from '../AttachmentPreview';
import type { TaskAttachment } from '@/lib/types';

describe('AttachmentPreview', () => {
  const mockImageAttachment: TaskAttachment = {
    id: 'att-1',
    fileName: 'test.jpg',
    originalName: 'test-image.jpg',
    fileType: 'image/jpeg',
    fileSize: 1024000,
    uploadedAt: new Date('2025-01-01T12:00:00.000Z'),
    taskId: 'task-1',
    thumbnail: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
    metadata: {
      width: 800,
      height: 600
    }
  };

  const mockPDFAttachment: TaskAttachment = {
    id: 'att-2',
    fileName: 'document.pdf',
    originalName: 'my-document.pdf',
    fileType: 'application/pdf',
    fileSize: 2048000,
    uploadedAt: new Date('2025-01-01T12:00:00.000Z'),
    taskId: 'task-1',
    metadata: {
      pageCount: 5
    }
  };

  const mockWordAttachment: TaskAttachment = {
    id: 'att-3',
    fileName: 'report.docx',
    originalName: 'quarterly-report.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 512000,
    uploadedAt: new Date('2025-01-01T12:00:00.000Z'),
    taskId: 'task-1'
  };

  it('renders image attachment with thumbnail', () => {
    render(<AttachmentPreview attachment={mockImageAttachment} />);
    
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.getByText(/Image • 1000 KB • 800x600/)).toBeInTheDocument();
    
    const img = screen.getByAltText('test-image.jpg');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockImageAttachment.thumbnail);
  });

  it('renders PDF attachment with metadata', () => {
    render(<AttachmentPreview attachment={mockPDFAttachment} />);
    
    expect(screen.getByText('my-document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/PDF Document • 2 MB • 5 pages/)).toBeInTheDocument();
  });

  it('renders Word document attachment', () => {
    render(<AttachmentPreview attachment={mockWordAttachment} />);
    
    expect(screen.getByText('quarterly-report.docx')).toBeInTheDocument();
    expect(screen.getByText(/Document • 500 KB/)).toBeInTheDocument();
  });

  it('renders thumbnail size correctly', () => {
    const { container } = render(
      <AttachmentPreview attachment={mockImageAttachment} size="thumbnail" />
    );
    
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', expect.stringContaining('test-image.jpg'));
  });

  it('shows action buttons on hover for card size', () => {
    render(<AttachmentPreview attachment={mockImageAttachment} size="card" />);
    
    // Action buttons should be in the DOM but hidden initially
    const downloadButton = screen.getByTitle('Download');
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton.closest('div')).toHaveClass('opacity-0');
  });

  it('handles missing thumbnail gracefully', () => {
    const attachmentWithoutThumbnail = { ...mockImageAttachment, thumbnail: undefined };
    render(<AttachmentPreview attachment={attachmentWithoutThumbnail} />);
    
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    // Should fall back to file icon
  });

  it('shows PDF indicator for PDF thumbnails', () => {
    const pdfWithThumbnail = { 
      ...mockPDFAttachment, 
      thumbnail: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...' 
    };
    
    render(<AttachmentPreview attachment={pdfWithThumbnail} />);
    
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<AttachmentPreview attachment={mockImageAttachment} onClick={handleClick} />);
    
    const container = screen.getByText('test-image.jpg').closest('div');
    container?.click();
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('hides metadata when showMetadata is false', () => {
    render(<AttachmentPreview attachment={mockImageAttachment} showMetadata={false} />);
    
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    expect(screen.queryByText(/Image • 1000.0 KB/)).not.toBeInTheDocument();
  });
});