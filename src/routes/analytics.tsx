import { createFileRoute, redirect } from "@tanstack/react-router";

// Alamat lama tetap berfungsi setelah struktur menu dirombak
export const Route = createFileRoute("/analytics")({
  beforeLoad: () => {
    throw redirect({ to: "/analitik" });
  },
});
