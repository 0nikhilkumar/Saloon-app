import { Resend } from "resend";

const RESEND_API_KEY='re_5k8msULy_GGHgfcRjM1aFK8ZhGPoxGnAA'

const resend = new Resend(RESEND_API_KEY);

async function sendingOTP(email, otp, username) {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Saloon App Verification Code",
      html: `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resend OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }

        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
        }

        .content {
            padding: 20px;
            color: #333;
        }

        .content p {
            font-size: 16px;
            line-height: 1.6;
        }

        .otp-code {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            background-color: #f9f9f9;
            border: 1px dashed #007bff;
            padding: 15px;
            margin: 20px 0;
            letter-spacing: 4px;
        }

        .cta-button {
            display: block;
            width: fit-content;
            margin: 20px auto;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-align: center;
            text-decoration: none;
            font-size: 16px;
            border-radius: 5px;
        }

        .footer {
            background-color: #f4f4f4;
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color: #777;
        }

        .footer a {
            color: #007bff;
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <h1>Resend OTP Verification</h1>
        </div>
        <div class="content">
            <p>Hello ${username},</p>

            <p>It seems you have requested to resend your OTP verification code. Use the following code to verify your email address:</p>

            <div class="otp-code">${otp}</div>

            <p>If you did not request this, please disregard this email. For any further assistance, feel free to contact our support team.</p>

            <p>Thank you for using HairHaven!</p>

            <p>Best regards,<br>The HairHaven Team</p>
        </div>
    </div>
</body>

</html>
`,
    });

    if (error) {
      return console.error({ error });
    }
  } catch (error) {
    console.log(error);
  }
}
export default sendingOTP;
