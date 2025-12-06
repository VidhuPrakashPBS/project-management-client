import { toast } from 'sonner';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using the Resend API
 *
 * @param {SendEmailOptions} - An object containing the email data: toEmail, subject, and html.
 * @returns {Promise<{success: boolean, error: string | null}>} - The result of sending the email.
 * @throws An error if the email could not be sent.
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const data = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/common/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail: to,
          subject,
          html,
        }),
      }
    );

    const result = await data.json();

    return result;
  } catch (error) {
    toast.error(`Error sending email: ${error}`, { duration: 3000 });
    return {
      success: false,
      error,
    };
  }
}

// Utility function to generate invitation email HTML
export function generateInvitationEmailHTML({
  userName,
  email,
  temporaryPassword,
  loginUrl,
  companyName = 'PBS-Project Management',
}: {
  userName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  companyName?: string;
}) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${companyName}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 20px;
            }
            .content {
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            .credentials-box {
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                padding: 15px;
                margin: 20px 0;
            }
            .button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 4px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                font-size: 14px;
                color: #6c757d;
                text-align: center;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 10px;
                border-radius: 4px;
                margin: 15px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to ${companyName}!</h1>
        </div>
        
        <div class="content">
            <h2>Hello ${userName},</h2>
            
            <p>You've been invited to join our platform! An account has been created for you with the following credentials:</p>
            
            <div class="credentials-box">
                <strong>Email:</strong> ${email}<br>
                <strong>Temporary Password:</strong> ${temporaryPassword}
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> Please log in and change your password immediately after your first login for security purposes.
            </div>
            
            <p>Click the button below to access your account:</p>
            
            <a href="${loginUrl}" class="button">Login to Your Account</a>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${loginUrl}">${loginUrl}</a></p>
            
            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            
            <p>Best regards,<br>The ${companyName} Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you didn't expect this invitation, please contact our support team.</p>
        </div>
    </body>
    </html>
  `;
}
