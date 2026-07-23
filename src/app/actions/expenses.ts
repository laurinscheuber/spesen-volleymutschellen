'use server'

import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export async function submitExpenseReport(
  items: Array<{
    amount: number
    date: string
    purpose: string
    category_id: string
    receipt_url: string
    team?: string
  }>,
  targetUserId?: string
) {
  if (!items || items.length === 0) {
    return { error: 'Der Spesenbericht muss mindestens eine Position enthalten.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Fetch current user profile
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!currentUserProfile) {
    return { error: 'Profil nicht gefunden.' }
  }

  let finalUserId = user.id
  let profile = currentUserProfile

  if (targetUserId && targetUserId !== user.id) {
    if (currentUserProfile.role !== 'admin') {
      return { error: 'Keine Berechtigung, Spesen für andere Personen zu erfassen.' }
    }
    // Fetch target user profile
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', targetUserId)
      .single()

    if (!targetProfile) {
      return { error: 'Profil der ausgewählten Person nicht gefunden.' }
    }
    finalUserId = targetUserId
    profile = targetProfile as any
  }

  // 1. Insert report
  const { data: report, error: reportError } = await supabase
    .from('expense_reports')
    .insert({
      user_id: finalUserId,
      status: 'offen',
    })
    .select()
    .single()

  if (reportError) {
    console.error('Failed to create report:', reportError)
    return { error: 'Spesenbericht konnte nicht erstellt werden: ' + reportError.message }
  }

  // 2. Insert items linked to the report
  const itemsWithReport = items.map((item) => ({
    report_id: report.id,
    amount: item.amount,
    date: item.date,
    purpose: item.purpose,
    category_id: item.category_id,
    receipt_url: item.receipt_url,
    team: item.team || null,
  }))

  const { error: itemsError } = await supabase
    .from('expense_items')
    .insert(itemsWithReport)

  if (itemsError) {
    console.error('Failed to insert items:', itemsError)
    // Attempt clean up of the report (though Cascade delete helps, explicit deletion is safer if orphaned)
    await supabase.from('expense_reports').delete().eq('id', report.id)
    return { error: 'Spesenpositionen konnten nicht hinzugefügt werden: ' + itemsError.message }
  }

  // 3. Send email to Admin/Cashier
  const cashierEmail = process.env.CASHIER_EMAIL || 'kassier@volleymutschellen.ch'
  const origin = (await headers()).get('origin') || 'http://localhost:3000'
  const adminUrl = `${origin}/admin/reports/${report.id}`
  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)

  await sendEmail({
    to: cashierEmail,
    subject: `Neuer Spesenbericht von ${profile.full_name}`,
    text: `Hallo Kassier,

${profile.full_name} (${profile.email || 'Keine E-Mail'}) hat einen neuen Spesenbericht eingereicht.

Gesamtbetrag: CHF ${totalAmount}
Anzahl Posten: ${items.length}

Bitte überprüfe die Belege und verarbeite die Auszahlung hier:
${adminUrl}

Sportliche Grüsse,
Volley Mutschellen Spesen-App`,
  })

  revalidatePath('/dashboard')
  return { success: true, reportId: report.id }
}

export async function updateReportStatus(
  reportId: string,
  status: 'in_auftrag' | 'ausbezahlt' | 'abgelehnt',
  adminNotes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Check admin status
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    return { error: 'Keine Administrator-Rechte.' }
  }

  // Fetch report details with profile (user to notify) and total amount
  const { data: report, error: fetchError } = await supabase
    .from('expense_reports')
    .select(`
      id,
      created_at,
      status,
      user_id,
      profiles (
        full_name,
        email,
        iban
      )
    `)
    .eq('id', reportId)
    .single()

  if (fetchError || !report) {
    return { error: 'Bericht nicht gefunden.' }
  }

  // Get report items total
  const { data: items } = await supabase
    .from('expense_items')
    .select('amount')
    .eq('report_id', reportId)

  const totalAmount = (items || []).reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)

  // 1. Update DB
  const updateData: any = {
    status,
    admin_notes: adminNotes || null,
  }

  if (status === 'ausbezahlt') {
    updateData.paid_at = new Date().toISOString()
  } else {
    updateData.paid_at = null
  }

  const { error: updateError } = await supabase
    .from('expense_reports')
    .update(updateData)
    .eq('id', reportId)

  if (updateError) {
    console.error('Failed to update report status:', updateError)
    return { error: 'Status konnte nicht aktualisiert werden: ' + updateError.message }
  }

  // 2. Send email to user
  const userProfile = report.profiles as any
  const createdDate = new Date(report.created_at).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  if (userProfile.email) {
    if (status === 'in_auftrag') {
      await sendEmail({
        to: userProfile.email,
        subject: 'Zahlungsauftrag für deine Spesen erfasst!',
        text: `Hallo ${userProfile.full_name},

Dein Spesenbericht vom ${createdDate} über CHF ${totalAmount} wurde geprüft und zur Auszahlung freigegeben.

Die Überweisung wurde im E-Banking erfasst und sollte in Kürze auf deiner hinterlegten IBAN gutgeschrieben werden.

Sportliche Grüsse,
Volley Mutschellen Spesen-App`,
      })
    } else if (status === 'ausbezahlt') {
      await sendEmail({
        to: userProfile.email,
        subject: 'Dein Spesenbericht wurde ausbezahlt!',
        text: `Hallo ${userProfile.full_name},

Dein Spesenbericht vom ${createdDate} über CHF ${totalAmount} wurde vom Kassier genehmigt und ausbezahlt.

Die Überweisung erfolgt auf deine IBAN: ${userProfile.iban}

Sportliche Grüsse,
Volley Mutschellen Spesen-App`,
      })
    } else {
      const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://spesen.volleymutschellen.ch'}/dashboard/reports/${reportId}`
      await sendEmail({
        to: userProfile.email,
        subject: 'Dein Spesenbericht wurde abgelehnt',
        text: `Hallo ${userProfile.full_name},

Dein Spesenbericht vom ${createdDate} über CHF ${totalAmount} wurde leider abgelehnt.

Begründung des Kassiers:
${adminNotes || 'Keine Begründung angegeben.'}

Du kannst deinen abgelehnten Bericht unter folgendem Link einsehen oder löschen, um ihn neu einzureichen:
${reportUrl}

Sportliche Grüsse,
Volley Mutschellen Spesen-App`,
      })
    }
  }

  revalidatePath('/admin')
  revalidatePath(`/admin/reports/${reportId}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function promoteDelayedPayments() {
  const supabase = await createClient()

  // Fetch all reports in 'in_auftrag' updated > 24 hours ago (1 day delay)
  const targetTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  
  const { data: reports, error } = await supabase
    .from('expense_reports')
    .select(`
      id,
      created_at,
      status,
      user_id,
      profiles (
        full_name,
        email,
        iban
      )
    `)
    .eq('status', 'in_auftrag')
    .lt('updated_at', targetTime)

  if (error || !reports || reports.length === 0) {
    return { success: true, count: 0 }
  }

  let promotedCount = 0

  for (const report of reports) {
    const { data: items } = await supabase
      .from('expense_items')
      .select('amount')
      .eq('report_id', report.id)

    const totalAmount = (items || []).reduce((sum, item) => sum + Number(item.amount), 0).toFixed(2)

    // Update report to 'ausbezahlt'
    const { error: updateError } = await supabase
      .from('expense_reports')
      .update({
        status: 'ausbezahlt',
        paid_at: new Date().toISOString()
      })
      .eq('id', report.id)

    if (!updateError) {
      promotedCount++
      
      const userProfile = report.profiles as any
      const createdDate = new Date(report.created_at).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })

      // Send email
      if (userProfile.email) {
        await sendEmail({
          to: userProfile.email,
          subject: 'Dein Spesenbericht wurde ausbezahlt!',
          text: `Hallo ${userProfile.full_name},

Dein Spesenbericht vom ${createdDate} über CHF ${totalAmount} wurde ausbezahlt.

Die Überweisung erfolgt auf deine IBAN: ${userProfile.iban}

Sportliche Grüsse,
Volley Mutschellen Spesen-App`,
        })
      }
    }
  }

  if (promotedCount > 0) {
    revalidatePath('/admin')
    revalidatePath('/dashboard')
  }

  return { success: true, count: promotedCount }
}

export async function deleteExpenseReport(reportId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Deleting report. DB trigger will enforce that:
  // - User owns the report
  // - Report is in status 'offen'
  const { error } = await supabase
    .from('expense_reports')
    .delete()
    .eq('id', reportId)

  if (error) {
    console.error('Failed to delete report:', error)
    return { error: 'Bericht konnte nicht gelöscht werden: ' + error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function createHistoricalExpenseReport(data: {
  targetUserId: string
  createdAt: string
  paidAt?: string
  status: 'ausbezahlt' | 'in_auftrag' | 'offen' | 'abgelehnt'
  adminNotes?: string
  items: Array<{
    amount: number
    date: string
    purpose: string
    category_id: string
    receipt_url?: string
    team?: string
  }>
}) {
  const { targetUserId, createdAt, paidAt, status, adminNotes, items } = data
  if (!items || items.length === 0) {
    return { error: 'Die Spesenabrechnung muss mindestens eine Position enthalten.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Nicht authentifiziert.' }
  }

  // Guard: Only admins can create historical expense reports
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentUserProfile || currentUserProfile.role !== 'admin') {
    return { error: 'Keine Berechtigung, historische Spesen nachzuerfassen.' }
  }

  const reportStatus = status || 'ausbezahlt'
  const createdDateIso = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString()
  const paidDateIso = paidAt
    ? new Date(paidAt).toISOString()
    : reportStatus === 'ausbezahlt'
    ? createdDateIso
    : null

  // 1. Insert report with historical attributes
  const { data: report, error: reportError } = await supabase
    .from('expense_reports')
    .insert({
      user_id: targetUserId,
      status: reportStatus,
      created_at: createdDateIso,
      paid_at: paidDateIso,
      admin_notes: adminNotes || null,
    })
    .select()
    .single()

  if (reportError) {
    console.error('Failed to create historical report:', reportError)
    return { error: 'Historische Spese konnte nicht erstellt werden: ' + reportError.message }
  }

  // 2. Insert items (receipt_url is optional for historical reports)
  const itemsWithReport = items.map((item) => ({
    report_id: report.id,
    amount: item.amount,
    date: item.date,
    purpose: item.purpose,
    category_id: item.category_id,
    receipt_url: item.receipt_url || '',
    team: item.team || null,
  }))

  const { error: itemsError } = await supabase
    .from('expense_items')
    .insert(itemsWithReport)

  if (itemsError) {
    console.error('Failed to insert historical items:', itemsError)
    await supabase.from('expense_reports').delete().eq('id', report.id)
    return { error: 'Spesenpositionen konnten nicht gespeichert werden: ' + itemsError.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/archive')
  revalidatePath('/admin/stats')
  revalidatePath('/dashboard')

  return { success: true, reportId: report.id }
}
