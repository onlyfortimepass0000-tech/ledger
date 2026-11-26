import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AnalyticsPeriod } from "../../shared/types";
import {
  getAnalytics,
  getInventory,
  getMenu,
  getOrderMeta,
  postInventoryAdjust,
  postOrder,
} from "./api";

export function useMenu() {
  return useQuery({ queryKey: ["menu"], queryFn: getMenu, staleTime: 5 * 60 * 1000 });
}

/** Always fresh when the screen opens or the window regains focus; no polling timer. */
export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: getInventory,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

/** Today's date label and the serial number the next entry will get. */
export function useOrderMeta() {
  return useQuery({
    queryKey: ["orderMeta"],
    queryFn: getOrderMeta,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useAnalytics(period: AnalyticsPeriod) {
  return useQuery({ queryKey: ["analytics", period], queryFn: () => getAnalytics(period) });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["orderMeta"] });
    },
  });
}

export function useAdjustInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postInventoryAdjust,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
