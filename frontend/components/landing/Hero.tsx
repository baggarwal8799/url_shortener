"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link2, ArrowRight } from "lucide-react";
import { isValidUrl } from "@/utils/helpers";
import { toast } from "sonner";

export function Hero() {
  const [url, setUrl] = useState("");
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const router = useRouter();

  const handleShorten = () => {
    // Validate URL
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL");
      return;
    }

    // Show sign up dialog instead of shortening
    setShowSignUpDialog(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleShorten();
    }
  };

  return (
    <>
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-background -z-10" />
        <div className="absolute top-20 right-10 size-72 bg-gradient-accent opacity-20 blur-3xl rounded-full -z-10" />
        <div className="absolute bottom-10 left-10 size-96 bg-gradient-primary opacity-10 blur-3xl rounded-full -z-10" />

        <div className="container mx-auto max-w-4xl text-center">
          {/* Heading */}
          <div className="mb-8 space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Shorten Links,{" "}
              <span className="text-gradient">Amplify Impact</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Create powerful short links with advanced analytics. Track every click, understand your audience.
            </p>
          </div>

          {/* URL Input */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Enter your long URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button
                size="lg"
                onClick={handleShorten}
                className="h-12 px-8 bg-gradient-accent hover:opacity-90 transition-opacity"
              >
                Shorten
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Free forever. No credit card required.
            </p>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { label: "Links Created", value: "10M+" },
              { label: "Clicks Tracked", value: "500M+" },
              { label: "Active Users", value: "100K+" },
              { label: "Countries", value: "150+" },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="text-3xl font-bold text-gradient">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sign Up Dialog */}
      <Dialog open={showSignUpDialog} onOpenChange={setShowSignUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">Sign up to create your short link!</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Create a free account to start shortening URLs and tracking analytics.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="bg-gradient-accent"
            >
              Create Account
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/login")}
            >
              Already have an account? Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
