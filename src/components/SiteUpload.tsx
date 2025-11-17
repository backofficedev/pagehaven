import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface SiteUploadProps {
  siteId: Id<"sites">;
  onUploadComplete: () => void;
}

export function SiteUpload({ siteId, onUploadComplete }: SiteUploadProps) {
  const generateUploadUrl = useMutation(api.sites.generateUploadUrl);
  const updateSiteFiles = useMutation(api.sites.updateSiteFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Check if it's a ZIP file
    if (!file.name.endsWith('.zip') && file.type !== 'application/zip') {
      toast.error("Please upload a ZIP file containing your static site");
      return;
    }

    setIsUploading(true);
    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload the file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      
      // Update the site with the uploaded files
      await updateSiteFiles({ siteId, siteFilesId: storageId });
      
      toast.success("Site uploaded successfully!");
      onUploadComplete();
    } catch (error) {
      toast.error("Failed to upload site");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-4xl mb-2">📁</div>
        <p className="text-gray-600 mb-2">
          {isUploading ? "Uploading..." : "Drop your ZIP file here or click to browse"}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          ZIP file should contain your HTML, CSS, JS, and other static assets
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Choose File"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}
