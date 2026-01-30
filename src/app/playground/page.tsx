'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  RefreshCw,
  Trash2,
  Zap,
  Server,
  Box,
  Clock,
  FileJson,
  Code2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import type { GatewayModel, ProviderMode } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatConfig {
  providerMode: ProviderMode;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: boolean;
  stream: boolean;
}

interface RequestInfo {
  traceId: string;
  startTime: number;
  latencyMs?: number;
  config: {
    providerMode: string;
    model: string;
    baseURL?: string;
    byokApplied?: boolean;
  };
}

const DEFAULT_MODELS = {
  gateway: [
    'anthropic/claude-sonnet-4',
    'openai/gpt-4o',
    'google/gemini-2.0-flash',
    'meta/llama-4-maverick',
    'xai/grok-3-mini',
  ],
  custom: ['gpt-4', 'llama-3', 'mistral-7b', 'custom-model'],
  sandbox: ['mock-gpt-4', 'mock-claude'],
};

export default function PlaygroundPage() {
  const [config, setConfig] = useState<ChatConfig>({
    providerMode: 'gateway',
    model: 'anthropic/claude-sonnet-4',
    temperature: 0.7,
    maxTokens: 2048,
    tools: false,
    stream: true,
  });

  const [customConfig, setCustomConfig] = useState({
    baseURL: '',
    apiKey: '',
    bearerToken: '',
  });

  const [sandboxConfig, setSandboxConfig] = useState({
    domain: '',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gatewayModels, setGatewayModels] = useState<GatewayModel[]>([]);
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [requestPayload, setRequestPayload] = useState<object | null>(null);
  const [responseData, setResponseData] = useState<object | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch gateway models
  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await fetch('/api/gateway/models');
        const data = await response.json();
        setGatewayModels(data.data || []);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    }
    fetchModels();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const payload = {
      messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
      config,
      ...(config.providerMode === 'custom' && { customConfig }),
      ...(config.providerMode === 'sandbox' && { sandboxConfig }),
    };

    setRequestPayload(payload);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const traceId = response.headers.get('X-Trace-Id') || 'unknown';

      setRequestInfo({
        traceId,
        startTime,
        config: {
          providerMode: config.providerMode,
          model: config.model,
        },
      });

      // Handle error responses (including API key not configured)
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `**Error (${response.status})**: ${errorData.message || errorData.error || 'Request failed'}\n\n${errorData.providerMode === 'gateway' && response.status === 401 ? '**Tip:** Add `AI_GATEWAY_API_KEY` to your `.env.local` file. Get your key at https://vercel.com/ai-gateway/api-keys' : ''}`,
        };
        setMessages([...newMessages, errorMessage]);
        setResponseData(errorData);
        setIsLoading(false);
        return;
      }

      if (config.stream) {
        // Handle streaming response (plain text stream from toTextStreamResponse)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
        };

        setMessages([...newMessages, assistantMessage]);

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          // toTextStreamResponse returns plain text chunks, just concatenate
          const chunk = decoder.decode(value);
          assistantContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: assistantContent }
                : m
            )
          );
        }

        setResponseData({
          role: 'assistant',
          content: assistantContent,
          streaming: true,
        });
      } else {
        // Handle non-streaming response
        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.text || 'No response',
        };

        setMessages([...newMessages, assistantMessage]);
        setResponseData(data);
      }

      setRequestInfo((prev) => ({
        ...prev!,
        latencyMs: Date.now() - startTime,
      }));
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setRequestInfo(null);
    setRequestPayload(null);
    setResponseData(null);
  };

  const availableModels =
    config.providerMode === 'gateway'
      ? gatewayModels.filter((m) => m.type === 'language').map((m) => m.id)
      : DEFAULT_MODELS[config.providerMode];

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select
              value={config.providerMode}
              onValueChange={(v) => setConfig((c) => ({ ...c, providerMode: v as ProviderMode }))}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gateway">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Gateway
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Server className="h-3 w-3" />
                    Self-Hosted
                  </div>
                </SelectItem>
                <SelectItem value="sandbox">
                  <div className="flex items-center gap-2">
                    <Box className="h-3 w-3" />
                    Sandbox
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={config.model}
              onValueChange={(v) => setConfig((c) => ({ ...c, model: v }))}
            >
              <SelectTrigger className="w-[220px] h-8 text-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.slice(0, 20).map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Code2 className="h-3 w-3 mr-1" />
                  Dev Tools
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[500px] sm:max-w-[500px]">
                <SheetHeader>
                  <SheetTitle>Developer Tools</SheetTitle>
                  <SheetDescription>
                    Inspect request/response data and traces
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <Tabs defaultValue="request">
                    <TabsList className="w-full">
                      <TabsTrigger value="request" className="flex-1">Request</TabsTrigger>
                      <TabsTrigger value="response" className="flex-1">Response</TabsTrigger>
                      <TabsTrigger value="trace" className="flex-1">Trace</TabsTrigger>
                    </TabsList>

                    <TabsContent value="request" className="mt-4">
                      {requestPayload ? (
                        <ScrollArea className="h-[calc(100vh-220px)]">
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <JsonView
                              data={requestPayload}
                              shouldExpandNode={allExpanded}
                              style={defaultStyles}
                            />
                          </div>
                        </ScrollArea>
                      ) : (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          Send a message to see the request
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="response" className="mt-4">
                      {responseData ? (
                        <ScrollArea className="h-[calc(100vh-220px)]">
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <JsonView
                              data={responseData}
                              shouldExpandNode={allExpanded}
                              style={defaultStyles}
                            />
                          </div>
                        </ScrollArea>
                      ) : (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          Response data will appear here
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="trace" className="mt-4">
                      {requestInfo ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border p-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Latency</p>
                                  <p className="font-medium">
                                    {requestInfo.latencyMs ? `${requestInfo.latencyMs}ms` : '...'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="rounded-lg border p-3">
                              <div className="flex items-center gap-2">
                                <FileJson className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Trace ID</p>
                                  <code className="text-xs">{requestInfo.traceId.slice(0, 12)}...</code>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-lg border p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Provider</span>
                              <Badge variant="outline">{requestInfo.config.providerMode}</Badge>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Model</span>
                              <code className="text-xs">{requestInfo.config.model}</code>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          Trace info will appear after a request
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="sm" className="h-8" onClick={clearChat}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-1">Start a conversation</p>
                <p className="text-sm">
                  {config.model} via {config.providerMode}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[44px] max-h-[200px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Config Only */}
      <div className="w-[280px] border-l">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-5">
            <div>
              <h3 className="font-medium text-sm mb-3">Settings</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Temperature</Label>
                    <span className="text-xs text-muted-foreground">{config.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, temperature: parseFloat(e.target.value) }))
                    }
                    className="w-full h-1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Max Tokens</Label>
                    <span className="text-xs text-muted-foreground">{config.maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={config.maxTokens}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, maxTokens: parseInt(e.target.value) }))
                    }
                    className="w-full h-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tools</Label>
                  <Switch
                    checked={config.tools}
                    onCheckedChange={(v) => setConfig((c) => ({ ...c, tools: v }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Streaming</Label>
                  <Switch
                    checked={config.stream}
                    onCheckedChange={(v) => setConfig((c) => ({ ...c, stream: v }))}
                  />
                </div>
              </div>
            </div>

            {/* Provider-specific config */}
            {config.providerMode === 'custom' && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium text-sm mb-3">Custom Provider</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Base URL</Label>
                      <Input
                        placeholder="http://localhost:8000/v1"
                        value={customConfig.baseURL}
                        onChange={(e) =>
                          setCustomConfig((c) => ({ ...c, baseURL: e.target.value }))
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">API Key</Label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={customConfig.apiKey}
                        onChange={(e) =>
                          setCustomConfig((c) => ({ ...c, apiKey: e.target.value }))
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {config.providerMode === 'sandbox' && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium text-sm mb-3">Sandbox</h3>
                  <div className="space-y-1">
                    <Label className="text-xs">Domain</Label>
                    <Input
                      placeholder="sandbox-xxx.vercel.app"
                      value={sandboxConfig.domain}
                      onChange={(e) =>
                        setSandboxConfig((c) => ({ ...c, domain: e.target.value }))
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Start a sandbox from the Sandbox page
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
