export const htmlEmail = (OTP)=>{
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
    </head>

    <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, Helvetica, sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f6f8; padding: 40px 15px;">
            <tr>
                <td align="center">

                    <table width="600" cellpadding="0" cellspacing="0" border="0"
                        style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">

                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 35px 30px 20px;">
                                <h1 style="margin: 0; font-size: 28px; color: #111827;">
                                    SATWA
                                </h1>
                            </td>
                        </tr>

                        <!-- Content -->
                        <tr>
                            <td style="padding: 20px 40px 40px; text-align: center;">

                                <h2 style="margin: 0 0 15px; font-size: 24px; color: #111827;">
                                    Verify Your Email
                                </h2>

                                <p style="margin: 0 auto 25px; max-width: 450px; font-size: 16px; line-height: 1.6; color: #6b7280;">
                                    Use the verification code below to complete your account verification.
                                </p>

                                <!-- OTP -->
                                <table cellpadding="0" cellspacing="0" border="0" align="center">
                                    <tr>
                                        <td style="
                                            background-color: #f3f4f6;
                                            border: 1px solid #e5e7eb;
                                            border-radius: 10px;
                                            padding: 18px 35px;
                                        ">
                                            <span style="
                                                font-size: 32px;
                                                font-weight: bold;
                                                letter-spacing: 8px;
                                                color: #111827;
                                            ">
                                                ${OTP}
                                            </span>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin: 25px 0 0; font-size: 14px; color: #6b7280;">
                                    This code will expire in
                                    <strong style="color: #111827;">10 minutes</strong>.
                                </p>

                                <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.5; color: #9ca3af;">
                                    If you didn't request this code, you can safely ignore this email.
                                </p>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                    © 2026 SATWA. All rights reserved.
                                </p>
                            </td>
                        </tr>

                    </table>

                </td>
            </tr>
        </table>

    </body>
    </html>`
}