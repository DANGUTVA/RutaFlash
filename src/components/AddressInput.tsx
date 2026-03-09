import { Camera, MapPin, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressInputProps {
  inputText: string;
  setInputText: (val: string) => void;
  ocrProgress: string | null;
  isProcessing: boolean;
  onScan: () => void;
  onLocation: () => void;
  onProcess: () => void;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (file: File) => void;
}

export default function AddressInput({
  inputText,
  setInputText,
  ocrProgress,
  isProcessing,
  onScan,
  onLocation,
  onProcess,
  onClear,
  fileInputRef,
  onFileChange,
}: AddressInputProps) {
  return (
    <div className="glass-card rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4">
      <h2 className="text-base md:text-lg font-semibold font-display flex items-center gap-2">
        <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
        </span>
        Links de Waze
      </h2>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          className="flex-1 gap-2 h-10 text-sm"
          onClick={onLocation}
        >
          <MapPin className="h-4 w-4" /> Mi Ubicación
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChange(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="relative">
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pega aquí los links de Waze (uno por línea)&#10;Ejemplo: https://waze.com/ul?ll=9.9281,-84.0907"
          className="min-h-[140px] resize-none bg-background/50 text-sm"
        />
        <AnimatePresence>
          {ocrProgress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-card/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center border border-primary/20"
            >
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
              <p className="text-sm font-semibold text-primary">{ocrProgress}</p>
              <p className="text-xs text-muted-foreground mt-1">Extrayendo texto de la foto...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2 gradient-header text-primary-foreground border-0 hover:opacity-90"
          onClick={onProcess}
          disabled={isProcessing || !inputText.trim()}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Procesar
        </Button>
        <Button variant="outline" size="icon" onClick={onClear} title="Limpiar todo">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
