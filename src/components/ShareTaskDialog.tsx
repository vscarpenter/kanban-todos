'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Copy, Check } from '@/lib/icons';
import type { Task } from '@/lib/types';
import { 
  generateTaskShareText, 
  generateTaskMailtoLink, 
  copyToClipboard 
} from '@/lib/utils/shareTask';

interface ShareTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareTaskDialog({ task, open, onOpenChange }: ShareTaskDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  if (!task) return null;

  const handleMailtoShare = () => {
    const mailtoLink = generateTaskMailtoLink(task, recipientEmail);
    window.location.href = mailtoLink;
    onOpenChange(false);
    toast.success('Email client opened with task details');
  };

  const handleCopyToClipboard = async (format: 'plain' | 'markdown') => {
    const text = generateTaskShareText(task, { format });
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopied(format);
      toast.success(`Task details copied to clipboard (${format})`);
      setTimeout(() => setCopied(null), 2000);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const plainText = generateTaskShareText(task, { format: 'plain' });
  const markdownText = generateTaskShareText(task, { format: 'markdown' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Share Task: {task.title}
          </DialogTitle>
          <DialogDescription>
            Share this task via email or copy the details to your clipboard
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="copy">Copy Details</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email (optional)</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="Enter email address..."
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email Preview</Label>
              <Textarea
                value={plainText}
                readOnly
                className="min-h-[200px] text-sm font-mono"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleMailtoShare} className="gap-2">
                <Mail className="h-4 w-4" />
                Open Email Client
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="copy" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plain Text</Label>
                <div className="relative">
                  <Textarea
                    value={plainText}
                    readOnly
                    className="min-h-[150px] text-sm font-mono pr-12"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => handleCopyToClipboard('plain')}
                  >
                    {copied === 'plain' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Markdown</Label>
                <div className="relative">
                  <Textarea
                    value={markdownText}
                    readOnly
                    className="min-h-[150px] text-sm font-mono pr-12"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => handleCopyToClipboard('markdown')}
                  >
                    {copied === 'markdown' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}