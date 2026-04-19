import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  Share2, 
  Copy, 
  Globe, 
  CheckCircle2, 
  Smartphone,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface StorefrontQRProps {
  storeUrl: string;
}

const StorefrontQR: React.FC<StorefrontQRProps> = ({ storeUrl }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'storefront-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    // Simple alert or toast could be added here
    alert('Store URL copied to clipboard!');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Core Card */}
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-100 flex flex-col items-center text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Scan to Shop</h3>
            <p className="text-slate-500 text-sm">Download your unique store QR code to print or share.</p>
          </div>

          <div 
            ref={qrRef}
            className="p-8 bg-white rounded-[2rem] border-4 border-slate-50 shadow-inner mb-8 transform hover:scale-105 transition-transform duration-500"
          >
            <QRCodeSVG 
              value={storeUrl} 
              size={240}
              level="H"
              includeMargin={false}
              fgColor="#1e293b" // slate-800
            />
          </div>

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={downloadQR}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              <Download className="w-5 h-5" />
              Download PNG
            </button>
            <button 
              onClick={copyUrl}
              className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
            >
              <Copy className="w-5 h-5" />
              Copy Shop Link
            </button>
          </div>
        </div>

        {/* Info & Guide */}
        <div className="space-y-6">
          <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              Why use QR Codes?
            </h4>
            <div className="space-y-4 relative z-10">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold border border-emerald-700/50">01</div>
                <div>
                  <p className="font-bold text-sm">App Installation</p>
                  <p className="text-xs text-emerald-100/70">Customers scan once to add your store to their home screen as a PWA.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold border border-emerald-700/50">02</div>
                <div>
                  <p className="font-bold text-sm">Marketing</p>
                  <p className="text-xs text-emerald-100/70">Paste it on delivery boxes or store windows to capture offline-to-online traffic.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-xs font-bold border border-emerald-700/50">03</div>
                <div>
                  <p className="font-bold text-sm">Instant Access</p>
                  <p className="text-xs text-emerald-100/70">No need to remember URLs. One scan takes them directly to your live inventory.</p>
                </div>
              </div>
            </div>
            {/* Design blobs */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-400/20 blur-[50px] rounded-full" />
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Storefront Preview
            </h4>
            <div className="p-4 bg-slate-50 rounded-2xl border border-dotted border-slate-200 font-mono text-[10px] text-slate-400 break-all mb-4">
              {storeUrl}
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-600">
              <Info className="w-4 h-4 flex-shrink-0" />
              <p className="text-[10px] font-medium leading-relaxed">
                This URL includes a <span className="font-bold">mode=shop</span> parameter, which ensures that whenever a customer scans this QR, they are taken directly to the shopping experience, ignoring the admin login.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorefrontQR;
