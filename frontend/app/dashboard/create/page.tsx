"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createUrlSchema, type CreateUrlFormData } from "@/lib/validations/url";
import { toast } from "sonner";
import { Loader2, Link2, Copy, Check, ExternalLink } from "lucide-react";
import { copyToClipboard } from "@/utils/helpers";

export default function CreateUrlPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUrlFormData>({
    resolver: zodResolver(createUrlSchema),
  });

  const onSubmit = async (data: CreateUrlFormData) => {
    setIsLoading(true);
    setCreatedUrl(null);

    try {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        toast.error("Please login to continue");
        router.push('/login');
        return;
      }

      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || result.message || 'Failed to create short URL');
      }

      // Backend returns: { success: true, data: url }
      const urlData = result.data || result;

      setCreatedUrl(urlData);
      toast.success("Short URL created successfully!");
      reset();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (url: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Create Short URL</h1>
        <p className="text-muted-foreground mt-2">
          Transform your long URLs into short, shareable links
        </p>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>URL Details</CardTitle>
          <CardDescription>
            Enter your long URL and customize your short link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Original URL */}
            <div className="space-y-2">
              <Label htmlFor="originalUrl">
                Long URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="originalUrl"
                type="url"
                placeholder="https://example.com/very/long/url/path"
                {...register("originalUrl")}
                disabled={isLoading}
              />
              {errors.originalUrl && (
                <p className="text-sm text-destructive">{errors.originalUrl.message}</p>
              )}
            </div>

            {/* Custom Alias */}
            <div className="space-y-2">
              <Label htmlFor="customAlias">
                Custom Alias <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">linkshort.io/</span>
                <Input
                  id="customAlias"
                  type="text"
                  placeholder="my-custom-link"
                  {...register("customAlias")}
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for auto-generated alias
              </p>
              {errors.customAlias && (
                <p className="text-sm text-destructive">{errors.customAlias.message}</p>
              )}
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expiresAt">
                Expiration Date <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                {...register("expiresAt")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Link will be automatically disabled after this date
              </p>
              {errors.expiresAt && (
                <p className="text-sm text-destructive">{errors.expiresAt.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-accent"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 size-4" />
                  Shorten URL
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Success Result */}
      {createdUrl && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <Check className="size-5" />
              URL Created Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Short URL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Short URL:</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={createdUrl.shortUrl || `http://localhost:4000/${createdUrl.shortCode}`}
                  readOnly
                  className="bg-white dark:bg-gray-900"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => handleCopy(createdUrl.shortUrl || `http://localhost:4000/${createdUrl.shortCode}`)}
                >
                  {copied ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  asChild
                >
                  <a
                    href={createdUrl.shortUrl || `http://localhost:4000/${createdUrl.shortCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            </div>

            {/* URL Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Short Code:</p>
                <p className="font-mono font-semibold">{createdUrl.shortCode}</p>
              </div>
              {createdUrl.expiresAt && (
                <div>
                  <p className="text-muted-foreground">Expires:</p>
                  <p className="font-semibold">
                    {new Date(createdUrl.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                View Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreatedUrl(null)}
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
