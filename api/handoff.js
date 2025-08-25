// /api/handoff.js
import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const TO_PRODUCTION = process.env.PRODUCTION_EMAIL; // <-- set this in your env

    if (!RESEND_API_KEY) {
      return res.status(400).json({ error: "Missing RESEND_API_KEY env var" });
    }
    if (!TO_PRODUCTION) {
      return res.status(400).json({ error: "Missing PRODUCTION_EMAIL env var" });
    }

    const { approvalLink, snapshot, approvalMeta } = req.body || {};
    const missing = [];
    if (!approvalLink) missing.push("approvalLink");
    if (!snapshot) missing.push("snapshot");
    if (!approvalMeta?.approverName) missing.push("approverName");
    if (!approvalMeta?.approverEmail) missing.push("approverEmail");

    if (missing.length) {
      return res.status(400).json({
        error: "Missing required fields",
        missing,
        received: {
          approvalLink: !!approvalLink,
          snapshot: !!snapshot,
          approverName: !!approvalMeta?.approverName,
          approverEmail: !!approvalMeta?.approverEmail,
        },
      });
    }

    const resend = new Resend(RESEND_API_KEY);

    const subject = `[LP Approval] ${approvalMeta.customerName || "Customer"}${
      approvalMeta.projectId ? ` – ${approvalMeta.projectId}` : ""
    }`;

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5;">
        <h2>Landing Page Approval</h2>
        <p><strong>Approver:</strong> ${escapeHtml(approvalMeta.approverName)} &lt;${escapeHtml(
      approvalMeta.approverEmail
    )}&gt;</p>
        ${
          approvalMeta.customerName
            ? `<p><strong>Customer/Company:</strong> ${escapeHtml(approvalMeta.customerName)}</p>`
            : ""
        }
        ${
          approvalMeta.projectId
            ? `<p><strong>Project ID:</strong> ${escapeHtml(approvalMeta.projectId)}</p>`
            : ""
        }
        ${
          approvalMeta.notes
            ? `<p><strong>Notes:</strong><br/>${escapeHtml(approvalMeta.notes)}</p>`
            : ""
        }
        <p><strong>Approved Link (immutable):</strong><br/>
          <a href="${approvalLink}">${approvalLink}</a>
        </p>
        <p>The JSON snapshot is attached.</p>
      </div>
    `;

    // Attach JSON snapshot
    const attachments = [
      {
        filename: `lp-approval-${Date.now()}.json`,
        content: Buffer.from(JSON.stringify(snapshot, null, 2)),
      },
    ];

    const fromAddress = process.env.RESEND_FROM || "no-reply@yourdomain.com"; // must be a verified sender/domain in Resend

    const result = await resend.emails.send({
      from: fromAddress,
      to: TO_PRODUCTION,
      // You can CC the approver so they get a copy:
      cc: approvalMeta.approverEmail,
      subject,
      html,
      attachments,
    });

    return res.status(200).json({ ok: true, id: result?.id || null });
  } catch (err) {
    console.error("handoff error:", err);
    return res.status(500).json({ error: "Server error", message: `${err}` });
  }
}

// tiny sanitiser
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}