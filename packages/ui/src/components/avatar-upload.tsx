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

    // Create local preview immediately
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
        // Fallback: convert to base64 data URL if no direct uploader
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
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="sr-only"
        aria-label="Upload profile photo"
      />
      <div className="relative group">
        <button
          type="button"
          onClick={handleTrigger}
          disabled={disabled || isUploading}
          className={cn(
            "relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center transition-all duration-240 border-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
            previewUrl
              ? "border-brass-500/80 hover:border-brass-400 shadow-md"
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
            <User className="w-9 h-9 text-slate-500" aria-hidden="true" />
          )}

          {/* Hover overlay with camera icon */}
          <div className="absolute inset-0 bg-ink-950/70 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-160">
            <Camera className="w-5 h-5 text-brass-400" />
            <span className="text-[10px] text-parchment-50 font-medium">
              {previewUrl ? "Change" : "Add Photo"}
            </span>
          </div>

          {/* Uploading progress spinner */}
          {isUploading && (
            <div className="absolute inset-0 bg-ink-950/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brass-400" />
            </div>
          )}
        </button>

        {/* Small action badge */}
        <div
          onClick={handleTrigger}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brass-500 text-ink-950 flex items-center justify-center shadow-md border-2 border-ink-950 cursor-pointer hover:bg-brass-400 transition-colors"
          aria-hidden="true"
        >
          <Camera className="w-4 h-4" />
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs text-slate-400 block font-medium">
          Profile Photo
        </span>
        <span className="text-[11px] text-slate-500">
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
