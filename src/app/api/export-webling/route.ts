import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'Start- und Enddatum erforderlich.' }, { status: 400 })
  }

  const supabase = await createClient()

  // 1. Authenticate & Role Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Keine Administrator-Rechte.' }, { status: 403 })
  }

  // 2. Fetch paid reports in date range
  const startTimestamp = `${start}T00:00:00.000Z`
  const endTimestamp = `${end}T23:59:59.999Z`

  const { data: reports, error } = await supabase
    .from('expense_reports')
    .select(`
      id,
      paid_at,
      profiles (
        full_name,
        iban
      ),
      expense_items (
        amount,
        date,
        purpose,
        categories (
          name
        )
      )
    `)
    .eq('status', 'ausbezahlt')
    .gte('paid_at', startTimestamp)
    .lte('paid_at', endTimestamp)
    .order('paid_at', { ascending: true })

  if (error) {
    console.error('Export query error:', error)
    return NextResponse.json({ error: 'Datenbank-Fehler beim Export.' }, { status: 500 })
  }

  // 3. Build CSV
  const headers = ['Datum', 'Mitglied', 'Zweck', 'Kategorie', 'Betrag', 'IBAN', 'Auszahlungsdatum']
  const delimiter = ';'
  
  const csvLines = [headers.join(delimiter)]

  for (const report of reports || []) {
    const userProfile = report.profiles as any
    const items = (report.expense_items as any[]) || []
    const paidAtFormatted = report.paid_at 
      ? new Date(report.paid_at).toLocaleDateString('de-CH')
      : ''

    for (const item of items) {
      const itemDateFormatted = new Date(item.date).toLocaleDateString('de-CH')
      const categoryName = item.categories?.name || 'Unbekannt'
      const amount = Number(item.amount).toFixed(2)
      
      // Escape double quotes in strings
      const cleanPurpose = `"${(item.purpose || '').replace(/"/g, '""')}"`
      const cleanName = `"${(userProfile?.full_name || '').replace(/"/g, '""')}"`
      const cleanCategory = `"${categoryName.replace(/"/g, '""')}"`

      const row = [
        itemDateFormatted,
        cleanName,
        cleanPurpose,
        cleanCategory,
        amount,
        userProfile?.iban || '',
        paidAtFormatted
      ]
      
      csvLines.push(row.join(delimiter))
    }
  }

  const csvString = csvLines.join('\r\n')
  
  // Prepend UTF-8 BOM so Excel opens it with the correct encoding
  const bom = Buffer.from('\uFEFF', 'utf-8')
  const csvBuffer = Buffer.concat([bom, Buffer.from(csvString, 'utf-8')])

  return new Response(csvBuffer, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="spesen-webling-${start}-bis-${end}.csv"`,
      'Cache-Control': 'no-cache'
    }
  })
}
