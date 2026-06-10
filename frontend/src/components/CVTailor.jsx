import { useState } from 'react'
import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, LevelFormat, BorderStyle
} from 'docx'
import { Sparkles, Lock, Download, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Zap, FileText, Eye, EyeOff } from 'lucide-react'
import { tailorCV } from '../lib/api'
import { useAuth } from '../App'

// --- DOCX export using docx npm package ---
async function downloadTailoredCV(tailored, profile, role, company) {
  const name = profile?.name || 'Candidate'
  const sections_children = []

  // NAME
  sections_children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text: name, bold: true, size: 36, font: 'Arial' })]
  }))

  // TITLE + LOCATION
  sections_children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({
      text: `${profile?.title || ''}${profile?.location ? '  |  ' + profile.location : ''}`,
      size: 22, color: '444444', font: 'Arial'
    })]
  }))

  // CONTACT — use actual details from profile, fallback to placeholder for missing fields
  const contactParts = []
  if (profile?.email) contactParts.push(profile.email)
  if (profile?.phone) contactParts.push(profile.phone)
  if (profile?.linkedin) contactParts.push(profile.linkedin)
  const contactText = contactParts.length > 0
    ? contactParts.join('  |  ')
    : '[Add: Email  |  Phone  |  LinkedIn]'

  sections_children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({
      text: contactText,
      size: 20, color: contactParts.length > 0 ? '333333' : '999999',
      italics: contactParts.length === 0, font: 'Arial'
    })]
  }))

  // Divider
  sections_children.push(new Paragraph({
    spacing: { after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1B6FEB', space: 1 } },
    children: []
  }))

  // PROFESSIONAL SUMMARY
  sections_children.push(new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', font: 'Arial', size: 22, bold: true, color: '1B6FEB' })]
  }))
  sections_children.push(new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text: tailored.professional_summary || '', font: 'Arial', size: 22 })]
  }))

  // KEY SKILLS
  sections_children.push(new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'KEY SKILLS', font: 'Arial', size: 22, bold: true, color: '1B6FEB' })]
  }))
  sections_children.push(new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text: (tailored.skills || []).join('  •  '), font: 'Arial', size: 20 })]
  }))

  // PROFESSIONAL EXPERIENCE
  sections_children.push(new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'PROFESSIONAL EXPERIENCE', font: 'Arial', size: 22, bold: true, color: '1B6FEB' })]
  }))

  for (const exp of (tailored.experience || [])) {
    sections_children.push(new Paragraph({
      spacing: { before: 120, after: 40 },
      children: [
        new TextRun({ text: exp.company || '', font: 'Arial', size: 22, bold: true }),
        new TextRun({ text: `  —  ${exp.title || ''}`, font: 'Arial', size: 22 }),
        new TextRun({ text: `  |  ${exp.duration || ''}`, font: 'Arial', size: 20, color: '666666' }),
      ]
    }))
    for (const bullet of (exp.bullets || [])) {
      sections_children.push(new Paragraph({
        numbering: { reference: 'bullets', level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: bullet, font: 'Arial', size: 20 })]
      }))
    }
  }

  // TECHNICAL PROJECTS
  if (tailored.technical_projects?.length > 0) {
    sections_children.push(new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text: 'SELECTED TECHNICAL PROJECTS', font: 'Arial', size: 22, bold: true, color: '1B6FEB' })]
    }))
    for (const proj of tailored.technical_projects) {
      sections_children.push(new Paragraph({
        spacing: { before: 100, after: 30 },
        children: [new TextRun({ text: proj.title || '', font: 'Arial', size: 22, bold: true })]
      }))
      if (proj.tech_stack) {
        sections_children.push(new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: proj.tech_stack, font: 'Arial', size: 20, italics: true, color: '666666' })]
        }))
      }
      for (const b of (proj.bullets || [])) {
        sections_children.push(new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          spacing: { after: 50 },
          children: [new TextRun({ text: b, font: 'Arial', size: 20 })]
        }))
      }
    }
  }

  // CERTIFICATIONS
  sections_children.push(new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text: 'CERTIFICATIONS', font: 'Arial', size: 22, bold: true, color: '1B6FEB' })]
  }))
  if (tailored.certifications?.length > 0) {
    for (const cert of tailored.certifications) {
      sections_children.push(new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun({ text: cert, font: 'Arial', size: 20 })]
      }))
    }
  } else {
    sections_children.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: '[Add certifications here]', font: 'Arial', size: 20, color: '999999', italics: true })]
    }))
  }

  // EDUCATION
  sections_children.push(new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text: 'EDUCATION', font: 'Arial', size: 22, bold: true, color: '1B6FEB' })]
  }))
  if (tailored.education?.length > 0) {
    for (const edu of tailored.education) {
      sections_children.push(new Paragraph({
        spacing: { before: 80, after: 30 },
        children: [new TextRun({ text: edu.degree || '', font: 'Arial', size: 22, bold: true })]
      }))
      sections_children.push(new Paragraph({
        spacing: { after: 50 },
        children: [new TextRun({ text: `${edu.institution || ''}${edu.location ? '  |  ' + edu.location : ''}`, font: 'Arial', size: 20, color: '444444' })]
      }))
    }
  } else {
    sections_children.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: '[Add your education here]', font: 'Arial', size: 20, color: '999999', italics: true })]
    }))
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } }
    },
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 360 } } }
        }]
      }]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
        }
      },
      children: sections_children
    }]
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name.replace(/\s+/g, '-')}-tailored-CV-${new Date().toISOString().split('T')[0]}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

function BriefingCard({ briefing }) {
  const [open, setOpen] = useState(true)
  if (!briefing) return null
  return (
    <div className="card" style={{ border: '1px solid var(--blue-accent)', background: 'var(--blue-pale)' }}>
      <button className="flex items-center justify-between w-full" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <Eye size={14} style={{ color: 'var(--blue-accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--navy-900)' }}>Application briefing</span>
          <span className="badge-blue">Screen only — not in CV</span>
        </div>
        {open ? <ChevronUp size={14} style={{ color: 'var(--text-ghost)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-ghost)' }} />}
      </button>
      {open && (
        <div className="mt-4 space-y-3" style={{ paddingTop: '12px', borderTop: '1px solid #BFDBFE' }}>
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--blue-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lead with</div>
            <p className="text-sm" style={{ color: 'var(--navy-900)' }}>{briefing.lead_with}</p>
          </div>
          {briefing.mirror_language?.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--blue-accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mirror these JD phrases</div>
              <div className="flex flex-wrap gap-1.5">
                {briefing.mirror_language.map((p, i) => (
                  <span key={i} className="px-2 py-1 rounded text-xs font-medium"
                    style={{ background: 'rgba(27,111,235,0.15)', color: 'var(--blue-accent)', border: '1px solid rgba(27,111,235,0.2)' }}>
                    "{p}"
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Downplay</div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{briefing.downplay}</p>
          </div>
          {briefing.add_if_possible && (
            <div>
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add if possible</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{briefing.add_if_possible}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CVTailor({ profile, rawCvText, evalJdText, evalRole, evalCompany, loading, setLoading, result, setResult }) {
  const { user, creditBalance, setCreditBalance, setShowAuthModal } = useAuth()
  const [error, setError]       = useState(null)
  const [showFullSummary, setShowFullSummary] = useState(true)

  const outOfCredits = user && creditBalance !== null && creditBalance <= 0
  const missingProfile = !profile
  const missingRawText = !rawCvText
  const missingCV    = missingProfile || missingRawText
  const missingJD    = !evalJdText || evalJdText.trim().length < 50

  async function handleTailor() {
    if (!user) { setShowAuthModal(true); return }
    if (outOfCredits || loading) return  // guard against double-click or in-flight request
    setLoading(true); setError(null); setResult(null)

    try {
      const { data } = await tailorCV(evalJdText, rawCvText, profile)
      setResult(data)
      if (data._credits?.balance !== undefined) setCreditBalance(data._credits.balance)
    } catch (e) {
      const detail = e.response?.data?.detail
      if (e.response?.status === 402) { setCreditBalance(0); return }
      if (e.response?.status === 401) { setShowAuthModal(true); return }
      setError(typeof detail === 'string' ? detail : 'CV tailoring failed. Try again.')
    } finally { setLoading(false) }
  }

  // Not signed in
  if (!user) return (
    <div className="card text-center py-8 animate-slide-up" style={{ border: '1px dashed var(--border)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--navy-900)' }}>
        <Lock size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Sign in to tailor your CV</h3>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>1 credit per tailoring</p>
      <button onClick={() => setShowAuthModal(true)}
        className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: 'var(--blue-accent)' }}>
        Sign in / Sign up
      </button>
    </div>
  )

  return (
    <div className="animate-slide-up space-y-3">

      {/* Credit meter */}
      {creditBalance !== null && (
        <div className="card" style={{ ...(creditBalance <= 1 ? { borderColor: 'var(--warning)', background: 'var(--warning-bg)' } : {}) }}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: creditBalance <= 1 ? 'var(--warning)' : 'var(--text-ghost)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>CV tailoring</span>
            </div>
            {creditBalance <= 1 && <span className="badge-amber">{creditBalance === 0 ? 'No credits' : '1 left'}</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: '4px', background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (creditBalance / 2) * 100)}%`, background: creditBalance === 0 ? 'var(--danger)' : creditBalance === 1 ? 'var(--warning)' : 'var(--blue-accent)' }} />
            </div>
            <span className="text-xs font-medium tabular-nums" style={{ color: creditBalance === 0 ? 'var(--danger)' : 'var(--text-muted)', minWidth: '60px', textAlign: 'right' }}>
              {creditBalance} credit{creditBalance !== 1 ? 's' : ''} left
            </span>
          </div>
        </div>
      )}

      {/* Out of credits */}
      {outOfCredits && (
        <div className="card text-center py-10" style={{ border: '2px solid var(--navy-800)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--navy-900)' }}>
            <Lock size={22} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.25rem', color: 'var(--navy-900)' }}>No credits remaining</h3>
          <p className="text-sm mt-2 mb-6 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
            Top up to continue tailoring CVs and evaluating jobs.
          </p>
          <div className="px-6 py-3 rounded-xl text-sm font-semibold text-white inline-block"
            style={{ background: 'linear-gradient(135deg, var(--blue-accent), var(--navy-700))' }}>
            ₹199 = 10 credits · ₹499 = 30 credits <span style={{ opacity: 0.6, fontWeight: 400 }}>(coming soon)</span>
          </div>
        </div>
      )}

      {/* Setup prompt — show what's missing */}
      {!outOfCredits && !result && (
        <div className="card">
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', color: 'var(--navy-900)', marginBottom: '4px' }}>
            Tailor CV for this role
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            AI rewrites your full CV to maximise ATS scoring and fit for the specific role.
          </p>

          {/* Checklist */}
          <div className="space-y-2 mb-5">
            {[
              { label: 'CV parsed', done: !!profile, hint: 'Upload your CV on My profile tab' },
              { label: 'CV text loaded', done: !!rawCvText, hint: 'Re-upload your CV — needed for full rewrite' },
              { label: 'JD evaluated', done: !missingJD, hint: 'Evaluate a job description first' },
            ].map(({ label, done, hint }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: done ? 'var(--success-bg)' : 'var(--surface-raised)', border: `1px solid ${done ? '#6EE7B7' : 'var(--border-light)'}` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: done ? 'var(--success)' : 'var(--border)', }}>
                  {done
                    ? <CheckCircle size={12} style={{ color: 'white' }} />
                    : <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-ghost)', display: 'block' }} />
                  }
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium" style={{ color: done ? 'var(--success)' : 'var(--text-secondary)' }}>{label}</span>
                  {!done && <span className="text-xs ml-2" style={{ color: 'var(--text-ghost)' }}>— {hint}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* What you'll get */}
          <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-light)' }}>
            <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What you get for 1 credit</div>
            <div className="space-y-2">
              {[
                ['Rewritten professional summary', 'Targets JD keywords, positions you as the ideal fit'],
                ['Optimised skills list', 'Reordered to match JD requirements, ATS-friendly'],
                ['Rewritten experience bullets', 'Quantified, uses JD language, highlights relevant impact'],
                ['Application briefing', 'What to lead with, JD phrases to mirror, what to downplay'],
                ['Downloadable .docx file', 'Ready to submit — edit further in Word if needed'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-2.5">
                  <CheckCircle size={13} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg mb-4 text-xs"
              style={{ background: 'var(--danger-bg)', border: '1px solid #FECACA', color: 'var(--danger)' }}>
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <button
            onClick={handleTailor}
            disabled={loading || missingCV || missingJD || outOfCredits}
            className="btn-primary w-full justify-center"
            style={{ opacity: (missingCV || missingJD) ? 0.5 : 1 }}>
            {loading
              ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Tailoring your CV with AI...</>
              : <><Sparkles size={15} />Tailor CV for this role — 1 credit</>
            }
          </button>
          {(missingCV || missingJD) && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-ghost)' }}>
              Complete the checklist above to enable tailoring
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: 'var(--blue-accent)' }}>
                {profile?.initials || '?'}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Tailored for <strong style={{ color: 'var(--text-secondary)' }}>{evalRole || 'this role'}</strong>
                {evalCompany ? <span> at <strong style={{ color: 'var(--text-secondary)' }}>{evalCompany}</strong></span> : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadTailoredCV(result, profile, evalRole, evalCompany)}
                className="btn-primary text-xs py-2">
                <Download size={13} />Download CV (.docx)
              </button>
              <button onClick={() => setResult(null)} className="btn-ghost text-xs py-2">
                Tailor again
              </button>
            </div>
          </div>

          {/* Application briefing — screen only */}
          <BriefingCard briefing={result.application_briefing} />

          {/* Professional summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="section-label mb-0">Professional summary</span>
              <span className="badge-green text-xs">In CV</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {result.professional_summary}
            </p>
          </div>

          {/* Skills */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="section-label mb-0">Optimised skills ({result.skills?.length || 0})</span>
              <span className="badge-green text-xs">In CV</span>
            </div>
            <div className="flex flex-wrap">
              {result.skills?.map((s, i) => (
                <span key={i} className="skill-chip-match">{s}</span>
              ))}
            </div>
          </div>

          {/* Experience */}
          {result.experience?.map((exp, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{exp.company}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{exp.title} · {exp.duration}</div>
                </div>
                <span className="badge-green text-xs">In CV</span>
              </div>
              <ul className="space-y-2">
                {exp.bullets?.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--blue-accent)', marginTop: '3px', flexShrink: 0 }}>•</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Technical Projects */}
          {result.technical_projects?.length > 0 && (
            <div className="card">
              <span className="section-label mb-3">Technical projects</span>
              <div className="space-y-4">
                {result.technical_projects.map((proj, i) => (
                  <div key={i}>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{proj.title}</div>
                    {proj.tech_stack && <div className="text-xs mt-0.5 mb-2" style={{ color: 'var(--text-ghost)', fontStyle: 'italic' }}>{proj.tech_stack}</div>}
                    <ul className="space-y-1">
                      {proj.bullets?.map((b, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--blue-accent)', flexShrink: 0 }}>•</span>{b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications + Education */}
          {(result.certifications?.length > 0 || result.education?.length > 0) && (
            <div className="grid grid-cols-2 gap-3">
              {result.education?.length > 0 && (
                <div className="card">
                  <span className="section-label mb-3">Education</span>
                  {result.education.map((e, i) => (
                    <div key={i} className="mb-2">
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{e.degree}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{e.institution}{e.location ? ` · ${e.location}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
              {result.certifications?.length > 0 && (
                <div className="card">
                  <span className="section-label mb-3">Certifications</span>
                  {result.certifications.map((c, i) => (
                    <div key={i} className="text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>{c}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Download CTA at bottom */}
          <div className="card" style={{ background: 'var(--navy-900)', border: 'none' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Your tailored CV is ready</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Download and open in Word to add contact details and education
                </div>
              </div>
              <button
                onClick={() => downloadTailoredCV(result, profile, evalRole, evalCompany)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--blue-accent)', color: 'white' }}>
                <Download size={14} />Download .docx
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
