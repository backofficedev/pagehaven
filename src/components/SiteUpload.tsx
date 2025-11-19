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
            // We need to inject the navigation script into HTML files
            // Since we can't easily unzip/modify/zip in the browser without a heavy library,
            // we'll rely on the server-side (Convex) or a more robust client-side solution later.
            // For now, we'll assume the user is uploading a zip that *needs* this script.
            // 
            // WAIT: We can't easily modify the zip here without a library like JSZip.
            // Let's check if JSZip is available in package.json.
            // It IS available: "jszip": "^3.10.1"

            const JSZip = (await import("jszip")).default;
            const zip = new JSZip();
            const loadedZip = await zip.loadAsync(file);

            const scriptToInject = `
<script>
(function() {
  // Script injected by PageHaven to handle navigation
  function notifyParent() {
    try {
      const path = window.location.pathname.split('/').slice(3).join('/');
      window.parent.postMessage({
        type: 'pagehaven-navigation',
        path: path
      }, '*');
    } catch (e) {
      console.error('Failed to notify parent:', e);
    }
  }

  // Notify on load
  notifyParent();

  // Notify on popstate (back/forward)
  window.addEventListener('popstate', notifyParent);

  // Intercept clicks on links
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href && link.href.startsWith(window.location.origin)) {
      // Let the navigation happen, then notify
      // We use a small timeout to allow the navigation to start/complete
      setTimeout(notifyParent, 100);
    }
  });
})();
</script>
`;

            // Iterate through files and inject script into HTML files
            const filesToUpdate: Promise<void>[] = [];

            loadedZip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && (relativePath.endsWith('.html') || relativePath.endsWith('.htm'))) {
                    filesToUpdate.push((async () => {
                        let content = await zipEntry.async("string");
                        // Inject before </body> or at the end
                        if (content.includes("</body>")) {
                            content = content.replace("</body>", `${scriptToInject}</body>`);
                        } else {
                            content += scriptToInject;
                        }
                        zip.file(relativePath, content);
                    })());
                }
            });

            await Promise.all(filesToUpdate);

            // Generate new zip
            const modifiedBlob = await zip.generateAsync({ type: "blob" });
            const modifiedFile = new File([modifiedBlob], file.name, { type: file.type });

            // Generate upload URL
            const uploadUrl = await generateUploadUrl();

            // Upload the file
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": modifiedFile.type },
                body: modifiedFile,
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
            console.error(error);
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
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
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
