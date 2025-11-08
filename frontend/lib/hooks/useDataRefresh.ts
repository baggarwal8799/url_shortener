import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Custom hook to trigger data refresh when:
 * 1. Page becomes visible (user switches back to tab)
 * 2. User navigates to the page
 */
export function useDataRefresh(callback: () => void, dependencies: any[] = []) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Refetch when navigating to this page
    if (previousPathname.current !== pathname) {
      callback();
      previousPathname.current = pathname;
    }
  }, [pathname, callback]);

  useEffect(() => {
    // Refetch when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        callback();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [callback, ...dependencies]);
}
