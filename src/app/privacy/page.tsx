'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Shield, Database, Eye, Lock, FileText, User } from '@/lib/icons';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          
          <p className="text-muted-foreground text-lg">
            Your privacy is our top priority. This policy explains how your data is handled in our Kanban task management application.
          </p>
          
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              100% Local Storage
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              No Data Collection
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Open Source
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Core Privacy Principles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Core Privacy Principles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✓ Your data never leaves your device
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    All tasks, boards, and settings are stored locally in your browser using IndexedDB.
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✓ No servers store your personal information
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    We don&apos;t operate any databases or servers that collect your task data.
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✓ You have complete control over your data
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Export, import, or delete your data anytime using the built-in tools.
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    ✓ We can&apos;t see what tasks you create
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your tasks are completely private and accessible only to you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                How Your Data is Stored
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Local Browser Storage</h4>
                  <p className="text-muted-foreground text-sm mb-2">
                    All application data is stored locally in your browser using IndexedDB, a client-side database. This includes:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Task titles, descriptions, and metadata</li>
                    <li>• Board names, colors, and configurations</li>
                    <li>• Application settings and preferences</li>
                    <li>• Archived tasks and their history</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Technical Note:</strong> IndexedDB is a web standard that stores data directly on your device. 
                    This data persists between browser sessions but remains completely local to your machine.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Data Sharing Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Task Sharing</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  When you use the task sharing feature:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Email sharing opens your local email client with pre-filled content</li>
                  <li>• Copy-to-clipboard creates formatted text locally in your browser</li>
                  <li>• No data is transmitted to external servers during sharing</li>
                  <li>• You choose exactly what information to share and with whom</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Import/Export</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  Data export and import features:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Generate JSON files containing your data locally</li>
                  <li>• Files are created and downloaded directly from your browser</li>
                  <li>• No cloud storage or external services involved</li>
                  <li>• You maintain complete control over exported files</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* What We Don't Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                What We Don&apos;t Collect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No names or email addresses</li>
                    <li>• No contact information</li>
                    <li>• No location data</li>
                    <li>• No demographic information</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Usage Analytics</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• No tracking cookies</li>
                    <li>• No usage analytics</li>
                    <li>• No behavioral data</li>
                    <li>• No performance metrics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Implementation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Technical Implementation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Static Site Architecture</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  This application is built as a static site with no backend servers:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Hosted on AWS S3 and CloudFront (static file hosting)</li>
                  <li>• No server-side processing or databases</li>
                  <li>• All functionality runs in your browser</li>
                  <li>• Open source code available for inspection</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Browser Compatibility</h4>
                <p className="text-muted-foreground text-sm">
                  The app requires modern browser features (IndexedDB, ES6+) but doesn&apos;t use any tracking or analytics libraries.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Questions or Concerns?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                If you have questions about this privacy policy or how your data is handled, 
                please note that since we don&apos;t collect any personal information, 
                we cannot identify or contact individual users.
              </p>
              <p className="text-muted-foreground text-sm">
                For technical questions about the application or to report issues, 
                you can visit the open source repository where the code is publicly available for review.
              </p>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="text-center text-sm text-muted-foreground pt-4">
            <Separator className="mb-4" />
            <p>Last Updated: August 14, 2025</p>
            <p className="mt-2">
              This privacy policy may be updated as the application evolves, 
              but our commitment to privacy-first design remains unchanged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}