/**
 * Email Templates for SWIXREPORT
 * Clean, minimal, professional B2B SaaS style
 */

export const WAITLIST_WELCOME = (email: string, position: number) => ({
  subject: "You're on the SWIXREPORT waitlist 🎉",
  text: `Hi there!

You're #${position} on the SWIXREPORT waitlist.

We're launching beta soon, and you'll be among the first to get access to our AI-powered analytics platform.

What happens next?
→ We'll email you when your beta invite is ready
→ Estimated wait time: 1-2 weeks
→ You can refer friends to move up the list

Thanks for your interest!

— The SWIXREPORT Team

P.S. Follow our progress: https://twitter.com/swixreport (if you have one)`,
  
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">SWIXREPORT</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">You're on the waitlist! 🎉</h2>
              
              <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              
              <p style="margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6;">
                You're <strong style="color: #0f172a;">#${position}</strong> on the SWIXREPORT waitlist.
              </p>
              
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                We're launching beta soon, and you'll be among the first to get access to our AI-powered analytics platform.
              </p>
              
              <div style="background-color: #f1f5f9; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; color: #0f172a; font-size: 14px; font-weight: 600;">What happens next?</p>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">We'll email you when your beta invite is ready</li>
                  <li style="margin-bottom: 8px;">Estimated wait time: 1-2 weeks</li>
                  <li>You can refer friends to move up the list</li>
                </ul>
              </div>
              
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Thanks for your interest!<br>
                <strong style="color: #0f172a;">— The SWIXREPORT Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                © 2025 SWIXREPORT. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
})

export const BETA_INVITE = (name: string, email: string, tempPassword: string, loginUrl: string = 'https://swixreport.com/login') => ({
  subject: "Welcome to SWIXREPORT Beta! 🚀",
  text: `Hi ${name}!

Welcome to SWIXREPORT Beta! 🎉

You're in! Here are your login credentials:

━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━

Email: ${email}
Temporary Password: ${tempPassword}

Login here: ${loginUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━

Important:
1. Change your password after first login (Settings → Security)
2. Complete the onboarding to unlock all features
3. This is beta - report bugs and share feedback!

Your feedback shapes the product. We're excited to have you!

Questions? Just reply to this email.

— The SWIXREPORT Team`,

  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">SWIXREPORT</h1>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">AI-Powered Analytics Platform</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 20px; font-weight: 600;">Welcome to Beta, ${name}! 🚀</h2>
              
              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                You're in! Here are your login credentials:
              </p>
              
              <!-- Credentials Box -->
              <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 16px; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Login Credentials</p>
                
                <div style="margin-bottom: 16px;">
                  <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px;">Email</p>
                  <p style="margin: 0; color: #ffffff; font-size: 14px; font-family: 'Courier New', monospace; background-color: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 4px;">${email}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px;">Temporary Password</p>
                  <p style="margin: 0; color: #ffffff; font-size: 14px; font-family: 'Courier New', monospace; background-color: rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 4px;">${tempPassword}</p>
                </div>
                
                <a href="${loginUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">Log In Now</a>
              </div>
              
              <!-- Important Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; color: #92400e; font-size: 14px; font-weight: 600;">⚠️ Important</p>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <li style="margin-bottom: 6px;">Change your password after first login (Settings → Security)</li>
                  <li style="margin-bottom: 6px;">Complete onboarding to unlock all features</li>
                  <li>This is beta - please report bugs and share feedback!</li>
                </ul>
              </div>
              
              <p style="margin: 0 0 16px; color: #475569; font-size: 14px; line-height: 1.6;">
                Your feedback shapes the product. We're excited to have you on this journey!
              </p>
              
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Questions? Just reply to this email.<br>
                <strong style="color: #0f172a;">— The SWIXREPORT Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                © 2025 SWIXREPORT. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
})

export const ONBOARDING_COMPLETE = (name: string) => ({
  subject: "You're all set! 🎉",
  text: `Hi ${name}!

Welcome aboard! You've completed onboarding and now have full access to SWIXREPORT.

What you can do now:
→ Connect your data sources
→ Generate AI-powered reports
→ Set up custom dashboards
→ Invite team members

Need help? Check out our docs or reply to this email.

Happy analyzing!

— The SWIXREPORT Team`,

  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #ffffff; font-size: 32px;">✓</span>
              </div>
              
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 24px; font-weight: 600;">You're all set, ${name}! 🎉</h2>
              
              <p style="margin: 0 0 32px; color: #475569; font-size: 16px; line-height: 1.6;">
                Welcome aboard! You now have full access to SWIXREPORT.
              </p>
              
              <div style="text-align: left; background-color: #f1f5f9; border-radius: 6px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0 0 16px; color: #0f172a; font-size: 14px; font-weight: 600;">What you can do now:</p>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                  <li>Connect your data sources</li>
                  <li>Generate AI-powered reports</li>
                  <li>Set up custom dashboards</li>
                  <li>Invite team members</li>
                </ul>
              </div>
              
              <p style="margin: 0; color: #475569; font-size: 14px;">
                Need help? Check out our docs or reply to this email.<br><br>
                <strong style="color: #0f172a;">Happy analyzing!<br>— The SWIXREPORT Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
})

