"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookingItem, AvailabilitySearchResult, CreateBookingRequest } from "./types";

export function useBookingsQuery(objectId?: string) {
  return useQuery<BookingItem[]>({
    queryKey: ["bookings", objectId || "all"],
    queryFn: async () => {
      const url = objectId
        ? `/api/cms/bookings?objectId=${objectId}`
        : `/api/cms/bookings`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Kunde inte hämta bokningar");
      return res.json();
    },
  });
}

export function useAvailabilitySearchQuery(params: {
  startDate: string;
  endDate: string;
  guests: number;
  pets: number;
  flexDays?: number;
  enabled?: boolean;
}) {
  return useQuery<AvailabilitySearchResult>({
    queryKey: [
      "availability",
      params.startDate,
      params.endDate,
      params.guests,
      params.pets,
      params.flexDays ?? 0,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        startDate: params.startDate,
        endDate: params.endDate,
        guests: String(params.guests),
        pets: String(params.pets),
        flexDays: String(params.flexDays ?? 0),
      });
      const res = await fetch(`/api/cms/bookings/search?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Tillgänglighetssökning misslyckades");
      return res.json();
    },
    enabled: params.enabled !== false && !!params.startDate && !!params.endDate,
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const res = await fetch("/api/cms/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Bokningsförfrågan kunde inte skickas");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bookings", variables.objectId] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
