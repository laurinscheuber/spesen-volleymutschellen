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
        "border-slate-800 bg-slate-950/50 hover:bg-slate-900 text-slate-300 gap-1.5 h-8 flex items-center justify-center rounded-lg cursor-pointer"
      )}>
        {isPdf ? <FileText className="h-4 w-4 text-blue-400" /> : <ImageIcon className="h-4 w-4 text-blue-400" />}
        <span>{label}</span>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full border-slate-850 bg-slate-900 text-slate-100 p-6 flex flex-col items-center justify-center rounded-xl shadow-2xl">
        <h3 className="text-base font-semibold self-start mb-4 text-white">Beleg-Vorschau</h3>
        <div className="w-full flex justify-center items-center rounded-lg overflow-hidden border border-slate-800 bg-slate-950 min-h-[300px] md:min-h-[500px]">
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
              "border-slate-800 bg-slate-950 text-slate-400 hover:text-white h-9 rounded-lg flex items-center justify-center"
            )}
          >
            Im neuen Tab öffnen
          </a>
          <Button onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white h-9 rounded-lg px-6">
            Schliessen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
