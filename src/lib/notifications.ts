import { createAdminClient } from "@/lib/supabase/admin";

type NotifyInput = {
  userId: string;
  orderId?: string;
  title: string;
  message: string;
  type?: string;
};

export async function createNotification(input: NotifyInput) {
  const admin = createAdminClient();
  const { data: notification, error } = await admin
    .from("notifications")
    .insert({
      user_id: input.userId,
      order_id: input.orderId,
      title: input.title,
      message: input.message,
      type: input.type ?? "order_update",
    })
    .select("id")
    .single();

  if (error) throw error;

  await sendEmailNotification(input)
    .then(async (sent) => {
      if (sent && notification?.id) {
        await admin.from("notifications").update({ email_sent_at: new Date().toISOString() }).eq("id", notification.id);
      }
    })
    .catch(() => undefined);

  return notification;
}

async function sendEmailNotification(input: NotifyInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(input.userId);
  const to = authUser.user?.email;
  if (!to) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: input.title,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>${escapeHtml(input.title)}</h2><p>${escapeHtml(input.message)}</p><p style="color:#6b7280;font-size:13px">JNJ Printing</p></div>`,
    }),
  });

  return response.ok;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
