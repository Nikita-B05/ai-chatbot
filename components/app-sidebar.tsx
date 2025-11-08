"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { Suspense } from "react";
import { PlusIcon, SparklesIcon } from "@/components/icons";
import { SidebarHistory } from "@/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <>
      <Sidebar className="group-data-[side=left]:border-r-0">
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row items-center justify-between">
              <Link
                className="flex flex-row items-center gap-0"
                href="https://onedayinsurance.ca/"
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <SparklesIcon size={20} />
                <span className="rounded-md px-2 font-semibold text-lg">
                One Day AI
                </span>
              </Link>
              <div className="flex flex-row gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-8 p-1 md:h-fit md:p-2"
                      onClick={() => {
                        setOpenMobile(false);
                        router.push("/");
                        router.refresh();
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <PlusIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent align="end" className="hidden md:block">
                    New Chat
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <Suspense
            fallback={
              <SidebarGroup>
                <div className="px-2 py-1 text-sidebar-foreground/50 text-xs">
                  Today
                </div>
                <SidebarGroupContent>
                  <div className="flex flex-col">
                    {[44, 32, 28, 64, 52].map((item) => (
                      <div
                        className="flex h-8 items-center gap-2 rounded-md px-2"
                        key={item}
                      >
                        <div
                          className="h-4 max-w-(--skeleton-width) flex-1 rounded-md bg-sidebar-accent-foreground/10"
                          style={
                            {
                              "--skeleton-width": `${item}%`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    ))}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            }
          >
            <SidebarHistory user={user} />
          </Suspense>
        </SidebarContent>
        <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
      </Sidebar>
    </>
  );
}
