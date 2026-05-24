import "./globals.css";
import { TrpcProvider } from "@/lib/trpc/provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata = {
  title: "BeautyBook — салон красоты",
  description: "Онлайн-запись клиентов в салон красоты"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <TrpcProvider>
          <AppShell>{children}</AppShell>
        </TrpcProvider>
      </body>
    </html>
  );
}
