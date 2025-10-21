/**
 * Calendar redirect utilities
 */

import { useRouter } from "next/navigation";
import { getCalendarPageUrl } from "./pubky-uri";

/**
 * Handle calendar creation redirect
 *
 * @param calendarUri - The created calendar URI
 * @param router - Next.js router instance
 */
export function handleCalendarCreated(
  calendarUri: string,
  router: ReturnType<typeof useRouter>,
) {
  console.log("Calendar created:", calendarUri);

  // Redirect to the newly created calendar page
  const pageUrl = getCalendarPageUrl(calendarUri);
  if (pageUrl) {
    router.push(pageUrl);
  }
}
