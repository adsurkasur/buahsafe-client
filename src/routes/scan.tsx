import { createFileRoute, redirect } from "@tanstack/react-router";

// Alamat lama tetap berfungsi setelah struktur menu dirombak
export const Route = createFileRoute("/scan")({
  beforeLoad: () => {
    throw redirect({ to: "/antrean" });
  },
});
