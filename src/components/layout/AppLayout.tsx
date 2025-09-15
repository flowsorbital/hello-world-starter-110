import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNavigation } from "./TopNavigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNavigation />
          <main className="flex-1 p-6">
            {children}
          </main>
          <footer className="border-t bg-card px-6 py-4 flex-shrink-0">
            <p className="text-sm text-muted-foreground text-center">
              Powered by Orbital Flows | © 2025
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}