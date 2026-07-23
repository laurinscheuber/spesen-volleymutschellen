'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'
import { Camera, FileUp, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'

interface ReceiptUploadProps {
  onUploadComplete: (url: string) => void
  onUploadStart: () => void
  disabled?: boolean
  value?: string
}

export default function ReceiptUpload({ onUploadComplete, onUploadStart, disabled, value }: ReceiptUploadProps) {
  const [compressing, setCompressing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Automatically reset internal state when parent resets value (e.g. after adding item to cart)
  useEffect(() => {
    if (!value) {
      setUploaded(false)
      setFileName(null)
      setError(null)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }, [value])

  const handleReset = () => {
    setUploaded(false)
    setFileName(null)
    setError(null)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
    onUploadComplete('')
  }

  const processAndUploadFile = async (file: File) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processAndUploadFile(file)
    }
  }

  const isbusy = compressing || uploading

  return (
    <div className="space-y-2">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={disabled || isbusy}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        disabled={disabled || isbusy}
        className="hidden"
      />

      <div
        className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-4 transition-colors ${
          disabled || isbusy
            ? 'bg-slate-50 border-slate-200 opacity-60'
            : uploaded
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex flex-col items-center text-center space-y-2 w-full">
          {compressing ? (
            <div className="py-2 flex flex-col items-center gap-1.5">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B255F]" />
              <span className="text-xs text-slate-500 font-medium">Komprimiere Bild...</span>
            </div>
          ) : uploading ? (
            <div className="py-2 flex flex-col items-center gap-1.5">
              <Loader2 className="h-6 w-6 animate-spin text-[#1B255F]" />
              <span className="text-xs text-slate-500 font-medium">Lade hoch...</span>
            </div>
          ) : uploaded ? (
            <div className="py-1 flex flex-col items-center gap-1.5 w-full">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <span className="text-xs text-emerald-600 font-bold">Beleg hochgeladen</span>
              {fileName && (
                <span className="text-[10px] text-slate-500 truncate max-w-[220px] block">{fileName}</span>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="mt-1 text-[11px] text-slate-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Anderen Beleg wählen</span>
              </button>
            </div>
          ) : (
            <div className="w-full space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Beleg hochladen oder fotografieren</span>
              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  disabled={disabled || isbusy}
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-[#1B255F] font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-[#1B255F]" />
                  <span>Kamera</span>
                </button>
                <button
                  type="button"
                  disabled={disabled || isbusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-bold text-xs py-2 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <FileUp className="h-4 w-4 text-slate-500" />
                  <span>Datei / PDF</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block pt-0.5">Fotos & PDFs werden automatisch optimiert</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg p-2.5">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
