import { type ActionFunctionArgs } from '@remix-run/cloudflare';

// Only export the action function
export async function action(args: ActionFunctionArgs) {
  // Import server-side modules dynamically
  const { chatAction } = await import('~/lib/.server/chat-action');
  return chatAction(args);
}
