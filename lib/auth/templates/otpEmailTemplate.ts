export function renderOtpEmailTemplate(code: string) {
  return `
  <html>
    <body style="font-family: Inter, sans-serif; background-color: #f8f9fa; padding: 24px;">
      <div style="max-width: 420px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #111; margin-bottom: 16px;">Welcome!</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #0070f3;">${code}</p>
        <p>This code expires in 10 minutes.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </body>
  </html>
  `;
}
