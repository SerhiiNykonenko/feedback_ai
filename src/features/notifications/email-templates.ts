import { z } from "zod";

export const feedbackRequestedEmailPayloadSchema = z.object({
  recipientName: z.string().min(1),
  requesterName: z.string().min(1),
  cycleName: z.string().min(1),
  actionUrl: z.string().url()
});

export type FeedbackRequestedEmailPayload = z.infer<
  typeof feedbackRequestedEmailPayloadSchema
>;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    };
    return entities[character];
  });
}

export function renderFeedbackRequestedEmail(payload: FeedbackRequestedEmailPayload) {
  const recipientName = escapeHtml(payload.recipientName);
  const requesterName = escapeHtml(payload.requesterName);
  const cycleName = escapeHtml(payload.cycleName);
  const actionUrl = escapeHtml(payload.actionUrl);

  return {
    text: `Hi ${payload.recipientName},\n\n${payload.requesterName} requested your feedback for ${payload.cycleName}.\n\nWrite feedback: ${payload.actionUrl}\n\nPlease do not forward this email.`,
    html: `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #dde2ea;border-radius:16px"><tr><td style="padding:32px"><div style="font-size:14px;font-weight:700;color:#5b36c9">BWT Feedback</div><h1 style="margin:16px 0 12px;font-size:24px">New feedback request</h1><p style="line-height:1.6">Hi ${recipientName},</p><p style="line-height:1.6"><strong>${requesterName}</strong> requested your feedback for <strong>${cycleName}</strong>.</p><p style="margin:28px 0"><a href="${actionUrl}" style="display:inline-block;padding:12px 18px;border-radius:9px;background:#5b36c9;color:#fff;text-decoration:none;font-weight:700">Write feedback</a></p><p style="font-size:12px;line-height:1.5;color:#697386">This message contains no feedback content. Please do not forward it.</p></td></tr></table></td></tr></table></body></html>`
  };
}
