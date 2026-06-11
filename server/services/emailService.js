import nodemailer from "nodemailer";

let transporter = null;
let previewMode = false;

async function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    previewMode = false;
    console.log("📧 Email: using SMTP", SMTP_HOST);
    return transporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  previewMode = true;
  console.log("📧 Email: using Ethereal test account (configure SMTP_* env vars for real delivery)");
  return transporter;
}

function formatTime(timeStr) {
  if (!timeStr) return "N/A";
  if (/AM|PM/i.test(timeStr)) return timeStr.trim();
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function buildTicketHtml(booking) {
  const seats = Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seats;
  const showDate = booking.showDate
    ? new Date(booking.showDate).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Booking Confirmation</title></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#1a1f2e;border-radius:16px;overflow:hidden;border:1px solid #e8b86d33;">
    <tr>
      <td style="background:linear-gradient(135deg,#e8b86d22,#e8b86d08);padding:24px;text-align:center;">
        <h1 style="margin:0;color:#e8b86d;font-size:22px;">🎬 TicketHub</h1>
        <p style="margin:8px 0 0;color:#86efac;font-size:14px;">Booking Confirmed!</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <h2 style="margin:0 0 8px;color:#fff;font-size:18px;">${booking.movieTitle || "Movie"}</h2>
        <p style="margin:0 0 16px;color:#9ca3af;font-size:13px;">${booking.movieGenres || ""}</p>
        <table width="100%" style="font-size:14px;">
          <tr><td style="padding:6px 0;color:#9ca3af;">Booking ID</td><td style="padding:6px 0;color:#e8b86d;font-weight:bold;">${booking.bookingRef}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Date</td><td style="padding:6px 0;">${showDate}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Time</td><td style="padding:6px 0;">${formatTime(booking.showTime)}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Theater</td><td style="padding:6px 0;">${booking.theaterName || "Cineplex"}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Screen</td><td style="padding:6px 0;">${booking.screenName || "Screen 1"}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Seats</td><td style="padding:6px 0;font-weight:bold;">${seats}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Total Paid</td><td style="padding:6px 0;font-weight:bold;">₹${Number(booking.totalPrice || 0).toLocaleString("en-IN")}</td></tr>
          ${booking.transactionId ? `<tr><td style="padding:6px 0;color:#9ca3af;">Transaction</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${booking.transactionId}</td></tr>` : ""}
        </table>
        <p style="margin:20px 0 0;padding:12px;background:#e8b86d15;border-radius:8px;font-size:13px;color:#d1d5db;text-align:center;">
          Please arrive 15 minutes before showtime. Show this email at the entrance.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background:#0f1117;text-align:center;font-size:11px;color:#6b7280;">
        © ${new Date().getFullYear()} TicketHub · Enjoy your show!
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendBookingConfirmationEmail(booking) {
  const to = booking.userEmail?.trim();
  if (!to) {
    return { sent: false, reason: "No email address provided" };
  }

  try {
    const transport = await getTransporter();
    const from = process.env.EMAIL_FROM || `"TicketHub" <${process.env.SMTP_USER || "noreply@tickethub.com"}>`;

    const info = await transport.sendMail({
      from,
      to,
      subject: `🎟️ Booking Confirmed — ${booking.movieTitle} | ${booking.bookingRef}`,
      html: buildTicketHtml(booking),
      text: [
        `Booking Confirmed — ${booking.movieTitle}`,
        `Booking ID: ${booking.bookingRef}`,
        `Date: ${booking.showDate}`,
        `Time: ${formatTime(booking.showTime)}`,
        `Seats: ${(booking.seats || []).join(", ")}`,
        `Total: ₹${booking.totalPrice}`,
      ].join("\n"),
    });

    const result = { sent: true, messageId: info.messageId };
    if (previewMode) {
      result.previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("📬 Preview email:", result.previewUrl);
    }
    return result;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    return { sent: false, reason: err.message };
  }
}
