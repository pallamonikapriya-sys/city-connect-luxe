import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, Droplets, ExternalLink, Loader2, Phone, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang } from "@/lib/i18n";
import { HYDERABAD_AREAS, PRIORITY_LABEL } from "@/lib/hyderabad";
import { analyzeComplaint, submitComplaint, type ComplaintAnalysis } from "@/lib/civic.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/report")({
  component: ReportPage,
  errorComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">Something went wrong. Please retry.</div>
    </SiteShell>
  ),
  notFoundComponent: () => (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">Not found.</div>
    </SiteShell>
  ),
});

const PRIORITY_STYLE: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-chart-1 text-background",
  medium: "bg-chart-4 text-background",
  low: "bg-muted text-muted-foreground",
};

function ReportPage() {
  const { lang, t } = useLang();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<"water" | "garbage">("water");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [analysis, setAnalysis] = useState<ComplaintAnalysis | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const onPhoto = (file?: File) => {
    if (!file) return;
    if (file.size > 6_000_000) {
      toast.error(lang === "te" ? "ఫోటో 6MB కంటే తక్కువ ఉండాలి" : "Please use a photo under 6MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(String(reader.result));
      setPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const analyze = useMutation({
    mutationFn: () =>
      analyzeComplaint({
        data: { kind, description, area, landmark, photoDataUrl, language: lang },
      }),
    onSuccess: (result) => {
      setAnalysis(result);
      setReference(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!analysis) throw new Error("Analyze the complaint first");
      let photoPath: string | undefined;
      if (photoFile) {
        const { data: session } = await supabase.auth.getUser();
        const uid = session.user?.id;
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${uid}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("complaint-photos").upload(path, photoFile);
        if (error) throw new Error(error.message);
        photoPath = path;
      }
      return submitComplaint({
        data: { analysis, description, area, landmark, photoPath },
      });
    },
    onSuccess: (row) => {
      setReference(row.reference_code);
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success(lang === "te" ? "ఫిర్యాదు నమోదైంది" : "Complaint filed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-4xl font-bold sm:text-5xl">
          <span className="text-gold">{lang === "te" ? "పౌర ఫిర్యాదు" : "Report a civic issue"}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {lang === "te"
            ? "నీటి లీకేజీ, కొరత లేదా చెత్త సమస్యను వివరించండి. AI దాన్ని వర్గీకరించి, ప్రాధాన్యత ఇచ్చి సరైన శాఖకు దారి చూపుతుంది."
            : "Describe a water or garbage problem. Nagaram classifies it, scores priority and hands it to the right municipal desk with a reference code."}
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex gap-2">
              {(
                [
                  { id: "water", icon: Droplets, label: t("water") },
                  { id: "garbage", icon: Trash2, label: t("garbage") },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setKind(option.id)}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm transition-colors ${
                    kind === option.id
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="description">
                  {lang === "te" ? "సమస్య వివరణ" : "What is happening?"}
                </Label>
                <Textarea
                  id="description"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    kind === "water"
                      ? lang === "te"
                        ? "ఉదా: మా వీధిలో మూడు రోజులుగా పైప్‌లైన్ లీక్ అవుతోంది…"
                        : "e.g. A pipeline has been leaking on our street for three days…"
                      : lang === "te"
                        ? "ఉదా: బస్టాప్ పక్కన చెత్త కుప్ప వారం రోజులుగా…"
                        : "e.g. A garbage pile next to the bus stop hasn't been cleared for a week…"
                  }
                  className="mt-1.5"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="area">{lang === "te" ? "ప్రాంతం" : "Area"}</Label>
                  <Input
                    id="area"
                    list="areas"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="mt-1.5"
                    placeholder="Kukatpally"
                  />
                  <datalist id="areas">
                    {HYDERABAD_AREAS.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <Label htmlFor="landmark">{lang === "te" ? "గుర్తు / చిరునామా" : "Landmark"}</Label>
                  <Input
                    id="landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="mt-1.5"
                    placeholder={lang === "te" ? "ఉదా: మెట్రో పిల్లర్ 512 దగ్గర" : "e.g. near metro pillar 512"}
                  />
                </div>
              </div>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onPhoto(e.target.files?.[0])}
                />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Camera className="h-4 w-4" />
                  <span className="ml-1.5">
                    {photoDataUrl
                      ? lang === "te"
                        ? "ఫోటో మార్చండి"
                        : "Change photo"
                      : lang === "te"
                        ? "ఫోటో జోడించండి"
                        : "Add a photo"}
                  </span>
                </Button>
                {photoDataUrl && (
                  <img
                    src={photoDataUrl}
                    alt="Uploaded evidence of the reported civic issue"
                    className="mt-4 max-h-56 w-full rounded-2xl object-cover"
                  />
                )}
              </div>

              <Button
                className="w-full"
                disabled={analyze.isPending || description.trim().length < 8}
                onClick={() => analyze.mutate()}
              >
                {analyze.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                <span className="ml-1.5">
                  {analyze.isPending ? t("analyzing") : lang === "te" ? "AI విశ్లేషణ" : "Analyze & prioritise"}
                </span>
              </Button>
            </div>
          </div>

          <div>
            {!analysis && (
              <div className="glass-panel flex h-full min-h-64 items-center justify-center rounded-3xl p-8 text-center text-sm text-muted-foreground">
                {lang === "te"
                  ? "విశ్లేషణ ఫలితం ఇక్కడ కనిపిస్తుంది — వర్గం, తీవ్రత, ప్రాధాన్యత మరియు సరైన శాఖ."
                  : "Your triage result appears here — category, severity, priority and the exact municipal channel."}
              </div>
            )}

            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl p-6"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_STYLE[analysis.priority]}`}
                  >
                    {PRIORITY_LABEL[analysis.priority][lang]}
                  </span>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs">
                    {lang === "te" ? "తీవ్రత" : "Severity"} {analysis.severity}/10
                  </span>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs">{analysis.categoryLabel}</span>
                </div>

                <h2 className="mt-4 text-lg font-semibold">{analysis.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{analysis.summary}</p>

                {analysis.detectedInPhoto && (
                  <p className="mt-3 rounded-2xl bg-accent/60 p-3 text-sm">
                    <strong>{lang === "te" ? "ఫోటోలో కనిపించినది: " : "Detected in photo: "}</strong>
                    {analysis.detectedInPhoto}
                  </p>
                )}
                {analysis.priorityReason && (
                  <p className="mt-3 text-sm text-muted-foreground">{analysis.priorityReason}</p>
                )}
                {analysis.publicHealthRisk && (
                  <p className="mt-3 text-sm text-destructive/90">{analysis.publicHealthRisk}</p>
                )}

                <div className="mt-5 rounded-2xl border border-border/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {lang === "te" ? "సరైన శాఖ" : "Routed to"}
                  </p>
                  <p className="mt-1 font-semibold">{analysis.department}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <a href={`tel:${analysis.channelPhone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                      <Phone className="h-3.5 w-3.5" />
                      {analysis.channelPhone}
                    </a>
                    <a
                      href={analysis.channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      {lang === "te" ? "అధికారిక పోర్టల్" : "Official portal"}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {lang === "te" ? "అంచనా పరిష్కార సమయం" : "Expected resolution"}:{" "}
                    {analysis.expectedResolutionDays} {lang === "te" ? "రోజులు" : "days"}
                  </p>
                </div>

                {analysis.citizenAdvice && (
                  <p className="mt-4 text-sm text-muted-foreground">{analysis.citizenAdvice}</p>
                )}

                {reference ? (
                  <div className="mt-6 rounded-2xl bg-primary/15 p-4 text-sm">
                    <p className="font-semibold">
                      {lang === "te" ? "రిఫరెన్స్ కోడ్" : "Reference code"}: {reference}
                    </p>
                    <Link to="/complaints" className="mt-2 inline-block text-primary hover:underline">
                      {t("navComplaints")} →
                    </Link>
                  </div>
                ) : (
                  <Button className="mt-6 w-full" disabled={submit.isPending} onClick={() => submit.mutate()}>
                    {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span className="ml-1.5">{t("submit")}</span>
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}