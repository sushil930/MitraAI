import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiService } from '@/utils/apiService';
import { Loader2, Copy, Mail, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface EmailGeneratorModalProps {
  open: boolean;
  onClose: () => void;
}

const TONES = [
  { value: 'Formal', label: 'Formal' },
  { value: 'Informal', label: 'Informal' },
  { value: 'Persuasive', label: 'Persuasive' },
  { value: 'Appreciative', label: 'Appreciative' },
  { value: 'Apologetic', label: 'Apologetic' },
  { value: 'Inquiring', label: 'Inquiring' },
  { value: 'Friendly', label: 'Friendly' },
  { value: 'Assertive', label: 'Assertive' }
];

const RECIPIENT_TYPES = [
  { value: 'Client', label: 'Client' },
  { value: 'Colleague', label: 'Colleague' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Employee', label: 'Employee' },
  { value: 'Vendor', label: 'Vendor' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Customer', label: 'Customer' },
  { value: 'Recruiter', label: 'Recruiter' },
  { value: 'Business Partner', label: 'Business Partner' }
];

const EmailGeneratorModal: React.FC<EmailGeneratorModalProps> = ({ open, onClose }) => {
  // Form state
  const [purpose, setPurpose] = useState<string>('');
  const [tone, setTone] = useState<string>('Formal');
  const [recipientType, setRecipientType] = useState<string>('none');
  const [keyInfo, setKeyInfo] = useState<string>('');
  const [callToAction, setCallToAction] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  
  // Generated email state
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  
  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<{subject?: boolean; body?: boolean; full?: boolean}>({});
  
  // Handle email generation
  const handleGenerateEmail = async () => {
    if (!purpose) {
      toast.error('Please provide the purpose of your email');
      return;
    }
    
    setIsGenerating(true);
    setEmailSubject('');
    setEmailBody('');
    
    try {
      const emailContent = await apiService.generateEmail(
        purpose, 
        tone, 
        recipientType === 'none' ? '' : recipientType, 
        keyInfo, 
        callToAction, 
        senderName
      );
      
      setEmailSubject(emailContent.subject);
      setEmailBody(emailContent.body);
      toast.success('Email generated successfully!');
    } catch (error) {
      console.error('Error generating email:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Copy functions with visual feedback
  const copyToClipboard = (text: string, type: 'subject' | 'body' | 'full') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus({ ...copyStatus, [type]: true });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
      
      // Reset the copy icon after 2 seconds
      setTimeout(() => {
        setCopyStatus({ ...copyStatus, [type]: false });
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    });
  };
  
  const hasGeneratedEmail = emailSubject && emailBody;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-7xl h-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            AI Email Generator
          </DialogTitle>
          <DialogDescription>
            Generate professional emails quickly and easily with AI.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section - Left Side */}
          <div className="space-y-4">
            <div className="text-base font-medium">Email Details</div>
            
            {/* Purpose (Required) */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Email <span className="text-destructive">*</span></Label>
              <Textarea 
                id="purpose" 
                placeholder="Describe what you want to achieve with this email (e.g., 'Request a meeting to discuss project timeline', 'Follow up on a sales lead')" 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            
            {/* Tone (Required) */}
            <div className="space-y-2">
              <Label htmlFor="tone">Email Tone <span className="text-destructive">*</span></Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select a tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map(tone => (
                    <SelectItem key={tone.value} value={tone.value}>{tone.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recipient Type (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="recipient-type">Recipient Type</Label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger id="recipient-type">
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None specified</SelectItem>
                    {RECIPIENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sender Name (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="sender-name">Your Name (Optional)</Label>
                <Input 
                  id="sender-name" 
                  placeholder="How to sign the email" 
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
            </div>
            
            {/* Key Information (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="key-info">Key Information to Include (Optional)</Label>
              <Textarea 
                id="key-info" 
                placeholder="Important details, dates, names, or facts that should be mentioned in the email" 
                value={keyInfo}
                onChange={(e) => setKeyInfo(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            
            {/* Call to Action (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="call-to-action">Desired Call to Action (Optional)</Label>
              <Input 
                id="call-to-action" 
                placeholder="What do you want the recipient to do? (e.g., 'Schedule a call', 'Reply with feedback')" 
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleGenerateEmail} 
              disabled={!purpose || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Email'
              )}
            </Button>
          </div>
          
          {/* Result Section - Right Side */}
          <div className="space-y-4">
            <div className="text-base font-medium">Generated Email</div>
            
            {isGenerating ? (
              <Card className="h-[calc(100%-2rem)]">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Subject:</Label>
                    <div className="p-2 bg-muted rounded-md">
                      <Skeleton className="h-6 w-full" />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Body:</Label>
                    <div className="p-3 bg-muted rounded-md h-[200px]">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between border-t p-4">
                  <div className="h-9 w-24">
                    <Skeleton className="h-full w-full rounded-md" />
                  </div>
                  <div className="h-9 w-36">
                    <Skeleton className="h-full w-full rounded-md" />
                  </div>
                </CardFooter>
              </Card>
            ) : hasGeneratedEmail ? (
              <Card className="h-[calc(100%-2rem)]">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Subject:</Label>
                    <div className="p-2 bg-muted rounded-md flex justify-between items-center">
                      <div className="whitespace-pre-wrap">{emailSubject}</div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="flex-shrink-0"
                        onClick={() => copyToClipboard(emailSubject, 'subject')}
                      >
                        {copyStatus.subject ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Body:</Label>
                    <div className="p-3 bg-muted rounded-md flex justify-between items-start h-[200px] overflow-auto">
                      <div className="whitespace-pre-wrap pr-8">{emailBody}</div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="flex-shrink-0 mt-1"
                        onClick={() => copyToClipboard(emailBody, 'body')}
                      >
                        {copyStatus.body ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between border-t p-4">
                  <Button 
                    variant="outline"
                    onClick={handleGenerateEmail} 
                    disabled={isGenerating}
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      'Regenerate'
                    )}
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => copyToClipboard(`Subject: ${emailSubject}\n\n${emailBody}`, 'full')}
                    size="sm"
                  >
                    {copyStatus.full ? (
                      <>
                        <CheckCheck className="mr-2 h-3 w-3" />
                        Copied Full Email
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-3 w-3" />
                        Copy Full Email
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-[360px] border rounded-md">
                <Mail className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">No Email Generated Yet</h3>
                <p>Fill out the form details and click "Generate Email" to create your email.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailGeneratorModal; 