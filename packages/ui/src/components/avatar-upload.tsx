"use client";

import * as React from "react";
import { Camera, Loader2, RotateCcw, User } from "lucide-react";
import { cn } from "../lib/utils";

export interface AvatarUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onFileSelect?: (file: File) => Promise<string | void>;
  firstName?: string;
  lastName?: string;
  disabled?: boolean;
  className?: string;
}

export function AvatarUpload({
  value,
  onChange,
  onFileSelect,
  firstName = "",
  lastName = "",
  disabled = false,
  className,
}: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>(value);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  const initials = React.useMemo(() => {
    const f = firstName.trim().charAt(0).toUpperCase();
    const l = lastName.trim().charAt(0).toUpperCase();
    return f || l ? `${f}${l}` : "";
  }, [firstName, lastName]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be under 5MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      if (onFileSelect) {
        const uploadedUrl = await onFileSelect(file);
        if (uploadedUrl) {
          setPreviewUrl(uploadedUrl);
          onChange?.(uploadedUrl);
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setPreviewUrl(result);
          onChange?.(result);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      setUploadError("Photo upload failed. Tap to try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTrigger = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        style={{ display: "none" }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="relative">
        <button
          type="button"
          onClick={handleTrigger}
          disabled={disabled || isUploading}
          style={{ width: 96, height: 96 }}
          className={cn(
            "relative w-24 h-24 rounded-full overflow-hidden flex flex-col items-center justify-center transition-colors border-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 shrink-0",
            previewUrl
              ? "border-brass-500 hover:border-brass-400 shadow-md"
              : "border-dashed border-slate-500/40 bg-ink-850 hover:border-brass-500/60 hover:bg-ink-800",
            uploadError && "border-coral-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label={previewUrl ? "Change profile photo" : "Upload profile photo"}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Profile photo preview"
              className="w-full h-full object-cover"
              onError={() => {
                setPreviewUrl(undefined);
                setUploadError("Failed to load image preview.");
              }}
            />
          ) : initials ? (
            <span className="font-serif text-2xl font-bold text-brass-400 select-none">
              {initials}
            </span>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
              <Camera className="w-6 h-6 text-brass-400" aria-hidden="true" />
              <span className="text-[10px] font-medium text-slate-300">Add Photo</span>
            </div>
          )}

          {/* Uploading progress spinner */}
          {isUploading && (
            <div className="absolute inset-0 bg-ink-950/85 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brass-400" />
            </div>
          )}
        </button>

        {/* Action badge */}
        <div
          onClick={handleTrigger}
          style={{ width: 32, height: 32 }}
          className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full bg-brass-500 text-ink-950 flex items-center justify-center shadow-md border-2 border-ink-950 cursor-pointer hover:bg-brass-400 transition-colors"
          aria-hidden="true"
        >
          <Camera className="w-4 h-4 text-ink-950" />
        </div>
      </div>

      <div className="text-center space-y-0.5">
        <span className="text-xs text-parchment-50 font-medium block">
          Profile Photo
        </span>
        <span className="text-[11px] font-mono text-slate-400 block">
          JPG, PNG, or WebP (max 5MB)
        </span>
      </div>

      {uploadError && (
        <button
          type="button"
          onClick={handleTrigger}
          className="text-xs text-coral-500 flex items-center gap-1 hover:underline cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{uploadError}</span>
        </button>
      )}
    </div>
  );
}
