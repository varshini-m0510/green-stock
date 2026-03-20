import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, Send } from "lucide-react";
import { toast } from "sonner";
import { callTrendAI } from "@/lib/aiAnalysis";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function TrendChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSendMessage() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        toast.error("API key not configured");
        return;
      }

      const response = await callTrendAI(input, apiKey, "Bengaluru, India");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error(error.message || "Failed to get response");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="border-b">
        <CardTitle className="text-base">🌟 Trending Items Advisor</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Ask about trending items for Bengaluru based on weather, season & social trends</p>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">
              💡 Ask about trending items in Bengaluru. I'll help based on current weather, season, and local trends.<br/>
              <span className="text-xs mt-2 block">Try: "What items are trending this week?" or "What products should I stock for the monsoon season?"</span>
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-muted text-muted-foreground rounded-bl-none"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg rounded-bl-none">
              <Loader className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about trending items in Bengaluru..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            disabled={loading}
            className="text-sm"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="shrink-0"
          >
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
