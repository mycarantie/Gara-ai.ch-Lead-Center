// Test cases:
//   normalizePhone("079 123 45 67")        -> "+41791234567"
//   normalizePhone("021.123.45.67")        -> "+41211234567"
//   normalizePhone("(021) 123-45-67")      -> "+41211234567"
//   normalizePhone("0041 79 123 45 67")    -> "+41791234567"
//   normalizePhone("+41 79 123 45 67")     -> "+41791234567"
//   normalizePhone("+41 (0)79 123 45 67")  -> "+41791234567"
//   normalizePhone("+33 6 12 34 56 78")    -> "+33612345678"
//   normalizePhone("")                     -> null
//   normalizePhone("  ")                   -> null
//   formatPhone("+41791234567")            -> "+41 79 123 45 67"
//   formatPhone("+33612345678")            -> "+33612345678"
//   whatsappLink("+41791234567", "Bonjour, ça va ?")
//                                          -> "https://wa.me/41791234567?text=Bonjour%2C%20%C3%A7a%20va%20%3F"
//   whatsappLink("+41791234567")           -> "https://wa.me/41791234567"
//   telLink("+41791234567")                -> "tel:+41791234567"

export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  let phone: string;
  if (trimmed.startsWith("+")) {
    phone = `+${digits}`;
  } else if (digits.startsWith("00")) {
    phone = `+${digits.slice(2)}`;
  } else if (digits.startsWith("0")) {
    phone = `+41${digits.slice(1)}`;
  } else {
    // TODO: number without 0 or country prefix; assumed to be Swiss
    phone = `+41${digits}`;
  }

  // "+41 (0)79 ..." keeps a stray national 0 after the country code
  if (phone.startsWith("+410")) phone = `+41${phone.slice(4)}`;
  return phone;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const match = /^\+41(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return match ? `+41 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone;
}

export function whatsappLink(phone: string, text?: string): string {
  const base = `https://wa.me/${phone.replace(/\D/g, "")}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telLink(phone: string): string {
  return `tel:${phone}`;
}

// Opens Gmail's compose screen (web, or the Gmail app on a phone) instead of relying on
// the system's default mail program, which on Windows is often Outlook.
export function gmailComposeLink(to: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}`;
}
