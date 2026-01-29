function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function renderSupportRequestEmail(
  title: string,
  message: string,
  userEmail?: string,
  ipAddress?: string
): string {
  const timestamp = new Date().toISOString();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0a0a0a; border-bottom: 2px solid #00bfa6; padding-bottom: 10px;">
        New Support Request
      </h2>
      
      <div style="margin-top: 20px;">
        <h3 style="color: #0a0a0a; margin-bottom: 10px;">Subject:</h3>
        <p style="background: #f9fafb; padding: 12px; border-radius: 6px; color: #0a0a0a;">
          ${escapeHtml(title)}
        </p>
      </div>
      
      <div style="margin-top: 20px;">
        <h3 style="color: #0a0a0a; margin-bottom: 10px;">Message:</h3>
        <p style="background: #f9fafb; padding: 12px; border-radius: 6px; color: #0a0a0a; white-space: pre-wrap;">
          ${escapeHtml(message)}
        </p>
      </div>
      
      ${userEmail ? `
        <div style="margin-top: 20px;">
          <h3 style="color: #0a0a0a; margin-bottom: 10px;">User Email:</h3>
          <p style="background: #f9fafb; padding: 12px; border-radius: 6px; color: #0a0a0a;">
            <a href="mailto:${escapeHtml(userEmail)}" style="color: #00bfa6; text-decoration: none;">
              ${escapeHtml(userEmail)}
            </a>
          </p>
        </div>
      ` : ''}
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #888e98; font-size: 12px; margin: 5px 0;">
          <strong>Timestamp:</strong> ${timestamp}
        </p>
        ${ipAddress && ipAddress !== 'unknown' ? `
          <p style="color: #888e98; font-size: 12px; margin: 5px 0;">
            <strong>IP Address:</strong> ${escapeHtml(ipAddress)}
          </p>
        ` : ''}
      </div>
    </div>
  `;
}

export function renderSupportConfirmationEmail(
  title: string,
  message: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #0a0a0a; border-bottom: 2px solid #00bfa6; padding-bottom: 10px;">
        We've Got Your Message!
      </h2>
      
      <div style="margin-top: 20px;">
        <p style="color: #0a0a0a; font-size: 16px; line-height: 1.6;">
          Hey there,
        </p>
        <p style="color: #0a0a0a; font-size: 16px; line-height: 1.6;">
          We've got your message! Our team is reviewing your message and will get back to you soon.
        </p>
        <p style="color: #0a0a0a; font-size: 16px; line-height: 1.6;">
          Need to add anything? Reply to this thread. You can also check out our Documentation.
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #0a0a0a; font-size: 16px; line-height: 1.6; margin-bottom: 10px;">
          Blumpo Team
        </p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; padding: 15px; border-radius: 6px;">
        <p style="color: #888e98; font-size: 12px; margin-bottom: 10px; font-weight: 600;">
          Your message:
        </p>
        <p style="color: #0a0a0a; font-size: 14px; margin-bottom: 8px; font-weight: 600;">
          ${escapeHtml(title)}
        </p>
        <p style="color: #0a0a0a; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
          ${escapeHtml(message)}
        </p>
      </div>
    </div>
  `;
}

