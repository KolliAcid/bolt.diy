import type { ActionFunctionArgs } from '@remix-run/cloudflare';

// Only export the action function
export async function action(args: ActionFunctionArgs) {
  // Dynamic import to avoid client-side inclusion of server code
  const { default: chatAction } = await import('~/lib/.server/chat-action');
  return chatAction(args);
}
