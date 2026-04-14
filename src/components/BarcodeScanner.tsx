import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = "barcode-scanner-container";

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner(
      containerId,
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Success
        onScan(decodedText);
        scanner.clear();
        onClose();
      },
      (errorMessage) => {
        // Error is often just "no code found in frame", so we don't show it unless it's critical
        if (errorMessage.includes("Camera access")) {
          setError("Camera access denied or not available.");
        }
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan, onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Scan Barcode</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory & POS Lookup</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900">{error}</p>
                <p className="text-xs text-rose-600 mt-1">Please ensure camera permissions are granted in your browser settings.</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="btn-secondary w-full flex items-center justify-center gap-2 bg-white"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                id={containerId} 
                className="overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 aspect-square"
              />
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Align barcode within the frame to scan
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Supports EAN, UPC, Code 128, and QR formats
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
