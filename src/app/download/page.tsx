"use client";

import { useState } from "react";
import { Download, CheckCircle, Loader2 } from "lucide-react";

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/download");
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "libera-project.tar.gz";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      alert("Erreur de telechargement");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🌱</div>
        <h1 className="text-2xl font-bold text-foreground">Libera</h1>
        <p className="text-muted-foreground">
          Telecharge le projet complet pour GitHub et Vercel.
        </p>
        <p className="text-sm text-muted-foreground">
          Fichier : libera-project.tar.gz (6.8 MB)
        </p>

        {done ? (
          <button
            disabled
            className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold text-lg"
          >
            <CheckCircle className="h-5 w-5" />
            Telecharge !
          </button>
        ) : (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg transition-colors cursor-pointer disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            {downloading ? "Telechargement..." : "Telecharger le projet"}
          </button>
        )}

        <div className="mt-8 p-4 rounded-xl bg-muted text-left text-sm space-y-2">
          <p className="font-semibold text-foreground">Apres le telechargement :</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Decompresse dans C:\Users\MINTYA\libera\</li>
            <li>Ouvre un terminal dans ce dossier</li>
            <li>git add -A</li>
            <li>git commit -m &quot;Initial commit&quot;</li>
            <li>git push -u origin main</li>
            <li>Va sur Vercel et connecte le repo</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
