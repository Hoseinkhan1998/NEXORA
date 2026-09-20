interface SendInvitationEmailParams {
  toEmail: string;
  workspaceName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}

export interface SendInvitationEmailResult {
  sent: boolean;
  error?: string;
}

/**
 * Dispatches an email invitation.
 * Uses Resend if RESEND_API_KEY is configured in the environment.
 * If not configured, gracefully returns sent: false so the UI can provide the direct join link.
 */
export async function sendInvitationEmail({
  toEmail,
  workspaceName,
  inviterName,
  role,
  inviteUrl,
}: SendInvitationEmailParams): Promise<SendInvitationEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "NEXORA <onboarding@resend.dev>";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `You've been invited to join ${workspaceName} on NEXORA`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Join ${workspaceName} on NEXORA</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #475569;">
                <strong>${inviterName}</strong> has invited you to collaborate in their NEXORA workspace as a <strong>${role}</strong>.
              </p>
              <div style="margin: 28px 0;">
                <a href="${inviteUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
                  Accept Invitation & Join
                </a>
              </div>
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                Or copy and paste this link into your browser:<br/>
                <a href="${inviteUrl}" style="color: #0284c7; word-break: break-all;">${inviteUrl}</a>
              </p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[sendInvitationEmail] Resend API error:", errorData);
        return { sent: false, error: "Failed to send email via provider." };
      }

      return { sent: true };
    } catch (err) {
      console.error("[sendInvitationEmail] Unexpected error:", err);
      return { sent: false, error: "Network error sending email." };
    }
  }

  // 2. Try Supabase Auth Admin built-in email sender if SUPABASE_SERVICE_ROLE_KEY is configured
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (serviceRoleKey && supabaseUrl) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(toEmail, {
        redirectTo: inviteUrl,
        data: {
          workspace_name: workspaceName,
          inviter_name: inviterName,
          role: role,
        },
      });

      if (!inviteErr) {
        return { sent: true };
      }

      console.error("[sendInvitationEmail] Supabase admin invite error:", inviteErr);
      return { sent: false, error: inviteErr.message };
    } catch (err) {
      console.error("[sendInvitationEmail] Supabase admin client error:", err);
      return { sent: false, error: "Failed to connect to Supabase admin auth." };
    }
  }

  // No email service configured
  return { sent: false, error: "No email provider configured." };
}

