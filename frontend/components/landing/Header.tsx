"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

export function Header() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="size-8 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Link2 className="size-5 text-white" />
          </div>
          <span className="text-xl font-bold">LinkShort</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
