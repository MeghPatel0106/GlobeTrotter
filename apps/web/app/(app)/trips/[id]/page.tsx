"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TripRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params.id) {
      router.replace(`/trips/${params.id}/itinerary`);
    }
  }, [params.id, router]);

  return null;
}
