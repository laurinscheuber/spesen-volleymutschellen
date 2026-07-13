'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'
import { Camera, FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ReceiptUploadProps {
  onUploadComplete: (url: string) => void
  onUploadStart: () => void
  disabled?: boolean
}

export default function ReceiptUpload({ onUploadComplete, onUploadStart, disabled }: ReceiptUploadProps) {
  const [compressing, setCompressing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploaded(false)
    setFileName(file.name)
    onUploadStart()

    let fileToUpload = file

    // 1. Image Compression (if it is an image)
    if (file.type.startsWith('image/')) {
      setCompressing(true)
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        }
        fileToUpload = await imageCompression(file, options)
      } catch (err) {
        console.error('Compression failed, uploading original:', err)
      } finally {
        setCompressing(false)
      }
    }

    // 2. Upload to Supabase Storage
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Nicht authentifiziert. Bitte logge dich erneut ein.')
      }

      const fileExt = file.name.split('.').pop()
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`
      const filePath = `${user.id}/${cleanFileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath)

      setUploaded(true)
      onUploadComplete(publicUrl)
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message || 'Upload fehlgeschlagen. Bitte versuche es erneut.')
      onUploadComplete('') // Signal failure
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <label className={`flex-1 flex flex-col items-center justify-center border border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
          disabled || compressing || uploading
            ? 'bg-slate-900/20 border-slate-800 pointer-events-none'
            : 'border-slate-800 bg-slate-950/50 hover:bg-slate-900/50'
        }`}>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            disabled={disabled || compressing || uploading}
            className="hidden"
            capture="environment"
          />
          <div className="flex flex-col items-center text-center space-y-1">
            {compressing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs text-slate-400">Komprimiere Bild...</span>
              </>
            ) : uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-xs text-slate-400">Lade hoch...</span>
              </>
            ) : uploaded ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <span className="text-xs text-emerald-400 font-medium">Beleg hochgeladen</span>
                <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{fileName}</span>
              </>
            ) : (
              <>
                <div className="flex gap-2 text-slate-400">
                  <Camera className="h-5 w-5" />
                  <FileUp className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-350">Foto aufnehmen oder Datei hochladen</span>
                <span className="text-[10px] text-slate-550">Bilder & PDFs</span>
              </>
            )}
          </div>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md p-2">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
