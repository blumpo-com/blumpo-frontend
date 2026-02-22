export function renderNewsletterConfirmationEmailTemplate(confirmationUrl: string) {
  return `
  <html>
    <body style="font-family: Inter, sans-serif; background-color: #f8f9fa; padding: 24px;">
      <div style="max-width: 420px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #111; margin-bottom: 16px;">Confirm your subscription</h2>
        <p style="color: #444; margin-bottom: 8px;">Thanks for your interest in the Blumpo newsletter!</p>
        <p style="color: #444; margin-bottom: 24px;">Click the button below to confirm your subscription. This link expires in 24 hours.</p>
        <a href="${confirmationUrl}" style="display: inline-block; background-color: #0a0a0a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px;">Confirm subscription</a>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999;">If you didn't sign up for this newsletter, you can safely ignore this email.</p>
      </div>
    </body>
  </html>
  `;
}
