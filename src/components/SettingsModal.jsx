import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getActiveProvider,
  getApiKey,
  getProviderModel,
  saveApiKey,
  clearApiKey,
  setActiveProvider,
  setProviderModel,
} from "../utils/groqClient";
import { getProvider, listProviders } from "../utils/aiProviders";

export default function SettingsModal({ onClose }) {
  const [providerId, setProviderId] = useState(getActiveProvider());
  const [modelId, setModelId] = useState(() => getProviderModel(getActiveProvider()));
  const [key, setKey] = useState(() => getApiKey(getActiveProvider()));
  const [saved, setSaved] = useState(false);

  const provider = useMemo(() => getProvider(providerId), [providerId]);

  useEffect(() => {
    setModelId(getProviderModel(providerId));
    setKey(getApiKey(providerId));
  }, [providerId]);

  const handleSave = () => {
    setActiveProvider(providerId);
    setProviderModel(providerId, modelId);
    saveApiKey(key, providerId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearApiKey(providerId);
    setKey("");
  };

  const freeModels = listProviders().flatMap((item) =>
    item.models.filter((model) => model.freeTier).map((model) => ({ provider: item, model })),
  );

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[min(96vw,64rem)] max-w-none max-h-[90vh] overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle className="px-5 pt-5">AI Settings</DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 flex min-h-0 flex-col gap-5">
          <div className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1 max-h-[calc(90vh-10rem)]">
            <div className="space-y-3">
              <div>
                <Label>Active Provider</Label>
                <select
                  className="mt-2 w-full h-11 rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface px-4 shadow-inner"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                >
                  {listProviders().map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-on-surface">{provider.label}</div>
                    <div className="text-xs text-on-surface-variant">{provider.description}</div>
                  </div>
                  <a
                    href={provider.createKeyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-primary underline underline-offset-2 shrink-0"
                  >
                    Create API key
                  </a>
                </div>

                <div>
                  <Label>Model</Label>
                  <select
                    className="mt-2 w-full h-11 rounded-xl border border-outline-variant bg-surface text-sm text-on-surface px-4 shadow-inner"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                  >
                    {provider.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>{provider.label} API Key</Label>
                  <Input
                    className="mt-2"
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder={provider.apiKeyPlaceholder}
                  />
                  <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                    {provider.label} keys are stored only in your browser's localStorage and are sent directly to the selected provider's API.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-on-surface">Free-tier models</div>
                  <div className="text-xs text-on-surface-variant">
                    These models can be used with the free tier for Gemini API. Groq models are also available from the same selector above.
                  </div>
                </div>
                <a
                  href={getProvider("gemini").createKeyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary underline underline-offset-2 whitespace-nowrap shrink-0"
                >
                  Get Gemini key
                </a>
              </div>
              <div className="space-y-2">
                {freeModels.map(({ provider: modelProvider, model }) => (
                  <div key={`${modelProvider.id}-${model.id}`} className="flex items-start justify-between gap-3 rounded-lg border border-outline-variant/70 bg-surface-container-low px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-on-surface">
                        {model.label}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        {modelProvider.label} · {model.description}
                      </div>
                    </div>
                    <a
                      href={modelProvider.createKeyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary underline underline-offset-2 shrink-0"
                    >
                      Create key
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleClear}>Clear Key</Button>
          <Button onClick={handleSave}>{saved ? "✓ Saved" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
