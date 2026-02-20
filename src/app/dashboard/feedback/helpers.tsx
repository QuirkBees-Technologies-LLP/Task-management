const supportEmail = 'support@OpsDeck.com';
const mailToSubject = 'Support Request';
const mailToBody = 'Hello, I need assistance with...';

export const mailtoLink = `mailto:${supportEmail}?subject=${encodeURIComponent(
  mailToSubject
)}&body=${encodeURIComponent(mailToBody)}`;
