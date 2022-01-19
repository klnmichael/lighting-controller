import { useEffect } from "react";
import { useSiteState, UpdateValues } from "@/states/use-site-state";

export const useRaf = (
  update: (values: UpdateValues) => boolean,
  render?: (values: UpdateValues) => void
) => {
  const { setRaf, removeRaf } = useSiteState();
  useEffect(() => {
    const raf = setRaf(update, render);
    return () => removeRaf(raf);
  }, [update, render]);
};
