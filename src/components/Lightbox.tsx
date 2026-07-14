'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { FileText, Image as ImageIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LightboxProps {
  url: string
  label?: string
}

export default function Lightbox({ url, label = 'Beleg anzeigen' }: LightboxProps) {
  const [open, setOpen] = useState(false)
  const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(
        buttonVariants({ variant: 'outline', size: 'sm' }),
        'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 gap-1.5 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors shadow-sm'
      )}>
        {isPdf
          ? <FileText className="h-3.5 w-3.5 text-[#1B255F]" />
          : <ImageIcon className="h-3.5 w-3.5 text-[#1B255F]" />}
        <span>{label}</span>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full border-slate-200 bg-white text-slate-900 p-6 flex flex-col items-center justify-center rounded-xl shadow-2xl">
        <h3 className="text-[17px] font-bold self-start mb-4 text-[#1B255F]">Beleg-Vorschau</h3>
        <div className="w-full flex justify-center items-center rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[300px] md:min-h-[500px]">
          {isPdf ? (
            <iframe
              src={url}
              className="w-full h-[500px] md:h-[650px] border-none"
              title="PDF Beleg"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Beleg Bild"
              className="max-h-[500px] md:max-h-[650px] w-auto object-contain"
            />
          )}
        </div>
        <div className="mt-4 flex gap-3 w-full justify-end">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'border-slate-200 bg-white text-slate-600 hover:text-slate-900 h-9 rounded-lg flex items-center justify-center shadow-sm'
            )}
          >
            Im neuen Tab öffnen
          </a>
          <Button
            onClick={() => setOpen(false)}
            className="bg-[#1B255F] hover:bg-[#1B255F]/90 text-white h-9 rounded-lg px-6 font-semibold"
          >
            Schliessen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
