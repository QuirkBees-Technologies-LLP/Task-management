import fs from 'fs';
import path from 'path';

/**
 * Loads an email template from the emails directory
 * @param templateName - Name of the template file (without .html extension)
 * @returns The HTML content of the template
 */
export function loadEmailTemplate(templateName: string): string {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.html`);
    const html = fs.readFileSync(templatePath, 'utf8');
    return html;
  } catch (error) {
    console.error(`Error loading email template ${templateName}:`, error);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
}

/**
 * Replaces placeholders in an email template with actual values
 * Supports simple {{placeholder}} syntax and basic conditional blocks
 * @param html - The HTML template string
 * @param variables - Object containing key-value pairs for replacement
 * @returns The HTML with placeholders replaced
 */
export function replaceTemplateVariables(
  html: string,
  variables: Record<string, string | undefined>
): string {
  let result = html;

  // Replace simple placeholders like {{name}}, {{resetLink}}, etc.
  Object.keys(variables).forEach((key) => {
    const value = variables[key] || '';
    // Replace {{key}} with value
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });

  // Handle simple conditional blocks like {{#if key}}...{{/if}}
  // Remove blocks where the key doesn't exist or is empty
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (match, key, content) => {
    const value = variables[key];
    // Check if value exists and is not empty (handle strings, numbers, etc.)
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      // Keep the content and process nested variables
      return replaceTemplateVariables(content, variables);
    }
    return ''; // Remove the block if condition is false
  });

  // Remove any remaining unreplaced placeholders
  result = result.replace(/\{\{[\w#\/]+\}\}/g, '');

  return result;
}

/**
 * Loads and processes an email template with variables
 * @param templateName - Name of the template file (without .html extension)
 * @param variables - Object containing key-value pairs for replacement
 * @returns The processed HTML ready to send
 */
export function getEmailTemplate(
  templateName: string,
  variables: Record<string, string | undefined>
): string {
  const html = loadEmailTemplate(templateName);
  return replaceTemplateVariables(html, variables);
}

