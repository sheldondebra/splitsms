/** Default SMS templates seeded for new accounts / dev seed. */
export const SAMPLE_SMS_TEMPLATES = [
  {
    name: "Welcome",
    content:
      "Hi {firstName}, welcome to our service! We're glad you're here. Reply STOP to opt out.",
    isFavorite: true,
  },
  {
    name: "Order confirmed",
    content:
      "Hello {name}, your order is confirmed. We'll text {phoneNumber} when it's ready for pickup.",
    isFavorite: true,
  },
  {
    name: "Appointment reminder",
    content:
      "Hi {firstName}, reminder: your appointment is tomorrow. Contact us at {phoneNumber} if you need to reschedule.",
    isFavorite: false,
  },
  {
    name: "Payment received",
    content:
      "Dear {name}, we received your payment. Thank you! — Team SplitSMS",
    isFavorite: false,
  },
  {
    name: "OTP verification",
    content:
      "Your verification code is 482910. Do not share this code. Valid for 10 minutes.",
    isFavorite: false,
  },
  {
    name: "Delivery update",
    content:
      "Hi {firstName}, your package is out for delivery today. Track updates will be sent to {phoneNumber}.",
    isFavorite: false,
  },
  {
    name: "Promo offer",
    content:
      "Hey {firstName}! Enjoy 20% off this weekend only. Show this SMS in-store. {country} customers only.",
    isFavorite: false,
  },
  {
    name: "Account alert",
    content:
      "Hi {name}, there was a sign-in to your account from a new device. If this wasn't you, email {email} immediately.",
    isFavorite: false,
  },
  {
    name: "Survey invite",
    content:
      "Hello {firstName} {lastName}, we'd love your feedback! It takes 2 minutes: https://example.com/survey",
    isFavorite: false,
  },
  {
    name: "Event invite",
    content:
      "You're invited, {name}! Join us Saturday 6pm. RSVP by replying YES to {phoneNumber}.",
    isFavorite: false,
  },
] as const;
