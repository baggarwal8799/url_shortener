import Link from "next/link";
import { Link2 } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-accent-purple to-accent-pink relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="size-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Link2 className="size-6" />
            </div>
            <span className="text-2xl font-bold">LinkShort</span>
          </Link>

          {/* Content */}
          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight">
              Shorten links, amplify your reach
            </h1>
            <p className="text-xl text-white/90">
              Join thousands of users who trust LinkShort for powerful URL shortening with advanced analytics.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold">10M+</div>
                <div className="text-white/80">Links Created</div>
              </div>
              <div>
                <div className="text-3xl font-bold">100K+</div>
                <div className="text-white/80">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-white/80">Uptime</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} LinkShort. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="size-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Link2 className="size-6 text-white" />
              </div>
              <span className="text-2xl font-bold">LinkShort</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
