import { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function msgClasses(role, type) {
  if (type === "success")
    return "bg-emerald-100 text-emerald-800 rounded-xl p-md font-body-md text-body-md w-full";
  if (type === "error")
    return "bg-error-container text-on-error-container rounded-xl p-md font-body-md text-body-md w-full";
  if (type === "ats")
    return "bg-amber-100 text-amber-800 self-start rounded-xl rounded-tl-none p-md font-body-md text-body-md w-full";
  if (role === "user")
    return "bg-primary-gradient text-on-primary rounded-xl rounded-tr-none p-md font-body-md text-body-md";
  return "bg-surface-container-high text-on-surface rounded-xl rounded-tl-none p-md font-body-md text-body-md";
}

export default forwardRef(function ChatTab(
  {
    messages,
    chatInput,
    setChatInput,
    sendMessage,
    isProcessing,
    handleEnhanceWording,
    sections,
    locale,
    selectedSection,
    setSelectedSection,
    selectedItem,
    setSelectedItem,
    handleUndo,
    setShowSettings,
  },
  messagesEndRef,
) {
  return (
    <div className="flex flex-col h-full">
      <header className="px-lg py-md border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4h-5v2h5v4l5-5z" />
            </svg>
          </div>
          <div>
            <h2 className="font-title-lg text-title-lg text-on-surface">
              Career AI Assistant
            </h2>
            <p className="font-label-md text-label-md text-outline">
              Active &amp; ready to optimize
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Button>
      </header>

      <div className="flex flex-col gap-1.5 px-lg py-md border-b border-outline-variant bg-surface">
        <select
          className="w-full h-11 rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface px-4 shadow-inner"
          value={selectedSection}
          onChange={(e) => {
            setSelectedSection(e.target.value);
            setSelectedItem("");
          }}
        >
          <option value="entire">Entire CV</option>
          {sections.map((s, i) => (
            <option key={s.id || i} value={i}>
              {s.title?.[locale] || s.title?.en || `Section ${i + 1}`}
            </option>
          ))}
        </select>
        {selectedSection && selectedSection !== "entire" && (
          <select
            className="w-full h-11 rounded-xl border border-outline-variant bg-surface-container-low text-sm text-on-surface px-4 shadow-inner"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">All items in this section</option>
            {sections[parseInt(selectedSection, 10)]?.items?.map(
              (item, i) => (
                <option key={i} value={i}>
                  Item #{i + 1}
                </option>
              ),
            )}
          </select>
        )}
      </div>

      <div className="chat-container flex-1 overflow-y-auto px-lg space-y-lg flex flex-col">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-on-surface-variant text-center max-w-[220px] leading-relaxed">
              Ask the AI to help you craft your CV content. Select a
              scope above, then type your request.
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isUser = msg.role === "user";
          const isSystem =
            msg.type === "success" ||
            msg.type === "error" ||
            msg.type === "ats";
          if (isSystem) {
            return (
              <div key={i} className="w-full">
                <div className={msgClasses(msg.role, msg.type)}>
                  <div className="whitespace-pre-wrap break-words">
                    {msg.text}
                  </div>
                  {msg.undo && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="mt-1.5 text-inherit opacity-80 hover:opacity-100"
                      onClick={handleUndo}
                    >
                      ↩ Undo
                    </Button>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div
              key={i}
              className={`flex items-start gap-md max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? "bg-primary-gradient" : "bg-secondary-container"}`}
              >
                {isUser ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-on-primary"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-on-secondary-container"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v4h-5v2h5v4l5-5z" />
                  </svg>
                )}
              </div>
              <div className={msgClasses(msg.role, msg.type)}>
                <div className="whitespace-pre-wrap break-words">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {isProcessing && (
          <div className="space-y-3 max-w-[85%] self-start w-full">
            <div className="flex items-start gap-md">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-secondary-container" />
              <div className="flex-1 rounded-xl rounded-tl-none p-md bg-surface-container-high space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-lg bg-surface border-t border-outline-variant">
        <div className="relative flex items-end gap-sm bg-surface-container-low border border-outline-variant rounded-2xl p-sm focus-within:ring-2 ring-primary transition-all">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-outline hover:text-primary rounded-full shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </Button>
          <textarea
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant py-sm outline-none"
            rows={1}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && sendMessage()
            }
            placeholder="Ask me to rewrite sections, check grammar, or suggest skills..."
            disabled={isProcessing}
          />
          <Button
            variant="default"
            size="icon-sm"
            className="bg-primary-gradient text-on-primary rounded-xl hover:shadow-md active:scale-95 transition-all shrink-0"
            onClick={() => sendMessage()}
            disabled={isProcessing || !chatInput.trim()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-sm mt-sm">
          <Button
            variant="outline"
            size="xs"
            onClick={handleEnhanceWording}
            disabled={isProcessing}
          >
            Enhance Wording
          </Button>
          <p className="font-label-md text-label-md text-outline ml-auto">
            AI can make mistakes. Verify info.
          </p>
        </div>
      </footer>
    </div>
  );
});
