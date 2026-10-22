import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { setDefaultOptions } from "date-fns";
import { id } from "date-fns/locale";
import { getRouter } from "./router";

// Semua format/formatDistanceToNow memakai bahasa Indonesia ("2 menit yang lalu", "23 Okt 2026")
setDefaultOptions({ locale: id });

const router = getRouter();

const rootElement = document.getElementById("root");
if (!rootElement?.innerHTML) {
  const root = createRoot(rootElement!);
  root.render(<RouterProvider router={router} />);
}
