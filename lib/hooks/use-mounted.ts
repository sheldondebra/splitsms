import { useSyncExternalStore } from "react";

/** True after client hydration — avoids SSR/client theme flash without useEffect setState. */
export function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
