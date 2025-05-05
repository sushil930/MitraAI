import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ open, onClose }) => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerRegionId = "qr-code-full-region"; // ID for the scanner element

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (open && !scannerRef.current && !scanResult) {
      // Add a small delay to ensure the DOM element exists
      timeoutId = setTimeout(() => {
        // Check if the element exists before initializing
        if (!document.getElementById(scannerRegionId)) {
          console.error(`Scanner region element with ID '${scannerRegionId}' not found after delay.`);
          setError("Failed to initialize scanner: Target element not found.");
          return;
        }

        try {
          const html5QrcodeScanner = new Html5QrcodeScanner(
            scannerRegionId,
            {
              fps: 10,
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdgePercentage = 0.7;
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                return {
                  width: qrboxSize,
                  height: qrboxSize,
                };
              },
              rememberLastUsedCamera: true,
              supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
              formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
            },
            /* verbose= */ false
          );

          const onScanSuccess = (decodedText: string, decodedResult: any) => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on success", err));
                scannerRef.current = null;
            }
            setScanResult(decodedText);
            setError(null);
          };

          const onScanFailure = (errorMessage: string) => {
            // console.warn(`QR error = ${errorMessage}`);
          };

          html5QrcodeScanner.render(onScanSuccess, onScanFailure);
          scannerRef.current = html5QrcodeScanner;
        } catch (err) {
            console.error("Error initializing Html5QrcodeScanner:", err);
            setError("Failed to initialize QR Code scanner.");
        }
      }, 100); // Delay initialization slightly (e.g., 100ms)

    } else if (!open && scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on close", err));
        scannerRef.current = null;
    }

    // Cleanup function
    return () => {
      // Clear the timeout if the component unmounts or dependencies change before it runs
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Clear the scanner if it exists
      if (scannerRef.current) {
        // Use a try-catch here as clear() might throw if already cleared or in a bad state
        try {
            scannerRef.current.clear();
        } catch (clearError) {
            console.error("Error during scanner cleanup:", clearError);
        }
        scannerRef.current = null;
      }
    };
  }, [open, scanResult]); // Dependencies remain the same

  const copyToClipboard = () => {
    if (scanResult) {
      navigator.clipboard.writeText(scanResult).then(() => {
        toast({ title: 'Copied to clipboard!' });
      }).catch(err => {
        console.error('Failed to copy:', err);
        toast({ title: 'Failed to copy text', variant: 'destructive' });
      });
    }
  };

  const openLink = () => {
    if (scanResult && (scanResult.startsWith('http://') || scanResult.startsWith('https://'))) {
      window.open(scanResult, '_blank', 'noopener,noreferrer');
    } else {
      toast({ title: 'Not a valid URL', variant: 'destructive' });
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    // Scanner will re-initialize via useEffect when scanResult becomes null
  };

  const handleClose = () => {
    if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner on manual close", err));
        scannerRef.current = null;
    }
    setScanResult(null); // Reset result on close
    setError(null);
    onClose();
  }

  const isUrl = scanResult && (scanResult.startsWith('http://') || scanResult.startsWith('https://'));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md w-full">
        <DialogHeader>
          <DialogTitle>QR Code Scanner</DialogTitle>
          {!scanResult && (
            <DialogDescription>
              Point your camera at a QR code.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">
          {/* This div will host the scanner */} 
          <div id={scannerRegionId} style={{ display: scanResult ? 'none' : 'block', minHeight: '250px' }}></div>

          {scanResult && (
            <div>
              <p className="mb-2 font-semibold">Scan Result:</p>
              {/* Use a textarea for potentially long results */}
              <textarea
                readOnly
                value={scanResult}
                className="w-full p-2 border rounded min-h-[60px] text-sm bg-muted mb-3"
                rows={3}
              />
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy to Clipboard">
                  <Copy className="h-4 w-4" />
                </Button>
                {isUrl && (
                  <Button variant="outline" size="icon" onClick={openLink} title="Open Link">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={resetScanner} title="Scan Another">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QrScannerModal;