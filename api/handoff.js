// /api/handoff.js
import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { company, project, approverName, approverEmail, notes, url } = req.body || {};
    if (!company || !project || !approverName || !approverEmail || !url) {
      return res.status(400).json({ ok: false, error: 'Missing fields' });
    }

    const approvalId = `appr_${Math.random().toString(36).slice(2)}${Date.now()}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.PRODUCTION_EMAIL;               // ← set in Vercel env
    const subject = `[APPROVED ${approvalId}] ${company} — ${project}`;
    const html = `
      <div style="font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
        <h2>Landing Page Approved</h2>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Project:</strong> ${project}</p>
        <p><strong>Approver:</strong> ${approverName} &lt;${approverEmail}&gt;</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        <p><strong>Snapshot URL:</strong><br><a href="${url}">${url}</a></p>
        <hr>
        <p>Approval ID: ${approvalId}</p>
      </div>
    `;

    await resend.emails.send({
      from: process.env.PRODUCTION_FROM || 'handoff@yourco.com',
      to,
      subject,
      html,
    });

    return res.status(200).json({ ok: true, approvalId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}