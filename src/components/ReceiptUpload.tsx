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

    if (file.type.startsWith('image/')) {
      setCompressing(true)
      try {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        })
      } catch (err) {
        console.error('Compression failed, uploading original:', err)
      } finally {
        setCompressing(false)
      }
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Nicht authentifiziert. Bitte logge dich erneut ein.')

      const fileExt = file.name.split('.').pop()
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`
      const filePath = `${user.id}/${cleanFileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, fileToUpload, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(filePath)

      setUploaded(true)
      onUploadComplete(publicUrl)
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message || 'Upload fehlgeschlagen. Bitte versuche es erneut.')
      onUploadComplete('')
    } finally {
      setUploading(false)
    }
  }

  const isbusy = compressing || uploading

  return (
    <div className="space-y-2">
      <label className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-5 cursor-pointer transition-colors ${
        disabled || isbusy
          ? 'bg-slate-50 border-slate-200 pointer-events-none opacity-60'
          : uploaded
          ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10'
          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
      }`}>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          disabled={disabled || isbusy}
          className="hidden"
          capture="environment"
        />
        <div className="flex flex-col items-center text-center space-y-1.5">
          {compressing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-[#1B255F]" />
              <span className="text-xs text-slate-500">Komprimiere Bild...</span>
            </>
          ) : uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-[#1B255F]" />
              <span className="text-xs text-slate-500">Lade hoch...</span>
            </>
          ) : uploaded ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <span className="text-xs text-emerald-500 font-semibold">Beleg hochgeladen</span>
              <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{fileName}</span>
            </>
          ) : (
            <>
              <div className="flex gap-2 text-[#1B255F]">
                <Camera className="h-5 w-5" />
                <FileUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Foto aufnehmen oder Datei hochladen</span>
              <span className="text-[10px] text-slate-400">Bilder & PDFs akzeptiert</span>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg p-2.5">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
