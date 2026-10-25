import { createFileRoute, redirect } from "@tanstack/react-router";

// Alamat lama tetap berfungsi setelah struktur menu dirombak
export const Route = createFileRoute("/master-data")({
  beforeLoad: () => {
    throw redirect({ to: "/pengaturan" });
  },
});
