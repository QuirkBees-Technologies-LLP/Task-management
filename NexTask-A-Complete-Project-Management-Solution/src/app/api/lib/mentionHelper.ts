/**
 * Extracts user mentions from HTML content
 * Looks for <span> elements with class "mention" and data-mention-id attribute
 * @param htmlContent - The HTML content to parse
 * @returns Array of user IDs that were mentioned
 */
export function extractMentionsFromHTML(htmlContent: string): string[] {
  if (!htmlContent) return [];

  const mentionIds: string[] = [];
  
  // Use regex to find all mention spans with data-mention-id
  const mentionRegex = /<span[^>]*class="[^"]*mention[^"]*"[^>]*data-mention-id="([^"]+)"[^>]*>/gi;
  let match;
  
  while ((match = mentionRegex.exec(htmlContent)) !== null) {
    const mentionId = match[1];
    if (mentionId && !mentionIds.includes(mentionId)) {
      mentionIds.push(mentionId);
    }
  }
  
  return mentionIds;
}


