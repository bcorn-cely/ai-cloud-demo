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
  MessageSquare,
  Settings2,
  Sparkles,
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
import { JsonTreeView } from '@/components/ui/code-block';
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

  const getProviderIcon = () => {
    if (config.providerMode === 'gateway') return <Zap className="h-4 w-4 text-emerald-500" />;
    if (config.providerMode === 'custom') return <Server className="h-4 w-4 text-blue-500" />;
    return <Box className="h-4 w-4 text-indigo-500" />;
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-gradient-to-b from-background to-muted/10">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-background/80 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <Select
              value={config.providerMode}
              onValueChange={(v) => setConfig((c) => ({ ...c, providerMode: v as ProviderMode }))}
            >
              <SelectTrigger className="w-[150px] h-9 bg-muted/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gateway">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-emerald-500" />
                    AI Gateway
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-blue-500" />
                    Self-Hosted
                  </div>
                </SelectItem>
                <SelectItem value="sandbox">
                  <div className="flex items-center gap-2">
                    <Box className="h-3.5 w-3.5 text-indigo-500" />
                    Sandbox
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={config.model}
              onValueChange={(v) => setConfig((c) => ({ ...c, model: v }))}
            >
              <SelectTrigger className="w-[240px] h-9 bg-muted/50 border-0">
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
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <Code2 className="h-4 w-4" />
                  Dev Tools
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[560px] sm:max-w-[560px] p-0">
                <SheetHeader className="p-6 pb-4 border-b bg-muted/30">
                  <SheetTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-emerald-500" />
                    Developer Tools
                  </SheetTitle>
                  <SheetDescription>
                    Inspect request/response data and traces
                  </SheetDescription>
                </SheetHeader>
                <div className="p-6">
                  <Tabs defaultValue="request">
                    <TabsList className="w-full h-10 bg-muted/50">
                      <TabsTrigger value="request" className="flex-1">Request</TabsTrigger>
                      <TabsTrigger value="response" className="flex-1">Response</TabsTrigger>
                      <TabsTrigger value="trace" className="flex-1">Trace</TabsTrigger>
                    </TabsList>

                    <TabsContent value="request" className="mt-4">
                      {requestPayload ? (
                        <JsonTreeView data={requestPayload} maxHeight="calc(100vh - 280px)" />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                            <FileJson className="h-7 w-7 opacity-50" />
                          </div>
                          <p className="font-medium mb-1">No request yet</p>
                          <p className="text-sm">Send a message to see the request payload</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="response" className="mt-4">
                      {responseData ? (
                        <JsonTreeView data={responseData} maxHeight="calc(100vh - 280px)" />
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                            <FileJson className="h-7 w-7 opacity-50" />
                          </div>
                          <p className="font-medium mb-1">No response yet</p>
                          <p className="text-sm">Response data will appear here</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="trace" className="mt-4">
                      {requestInfo ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <Clock className="h-5 w-5 text-emerald-500" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Latency</p>
                                    <p className="font-semibold text-lg">
                                      {requestInfo.latencyMs ? `${requestInfo.latencyMs}ms` : '...'}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <FileJson className="h-5 w-5 text-blue-500" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Trace ID</p>
                                    <code className="text-sm font-mono">{requestInfo.traceId.slice(0, 12)}...</code>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          <Card className="border-0 bg-muted/30">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Provider</span>
                                <Badge variant="outline" className="font-medium">
                                  {requestInfo.config.providerMode}
                                </Badge>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Model</span>
                                <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">
                                  {requestInfo.config.model}
                                </code>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                            <Clock className="h-7 w-7 opacity-50" />
                          </div>
                          <p className="font-medium mb-1">No trace yet</p>
                          <p className="text-sm">Trace info will appear after a request</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={clearChat}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-emerald-500/70" />
                </div>
                <p className="text-lg font-medium mb-2">Start a conversation</p>
                <div className="flex items-center justify-center gap-2 text-sm">
                  {getProviderIcon()}
                  <span>{config.model}</span>
                  <span className="text-muted-foreground/50">via {config.providerMode}</span>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-muted/80 border border-border/50'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-muted/80 border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
                    <span className="text-sm">Generating...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[52px] max-h-[200px] resize-none bg-muted/50 border-0 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="h-[52px] w-[52px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Config */}
      <div className="w-[300px] border-l bg-muted/10">
        <ScrollArea className="h-full">
          <div className="p-5 space-y-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Model Settings</h3>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-muted-foreground">Temperature</Label>
                  <Badge variant="secondary" className="text-xs font-mono">{config.temperature}</Badge>
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
                  className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-emerald-500 [&::-webkit-slider-thumb]:to-teal-500 [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-muted-foreground">Max Tokens</Label>
                  <Badge variant="secondary" className="text-xs font-mono">{config.maxTokens}</Badge>
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
                  className="w-full h-2 rounded-full appearance-none bg-muted cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-emerald-500 [&::-webkit-slider-thumb]:to-teal-500 [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <Label className="text-xs font-medium">Tools</Label>
                <Switch
                  checked={config.tools}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, tools: v }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <Label className="text-xs font-medium">Streaming</Label>
                <Switch
                  checked={config.stream}
                  onCheckedChange={(v) => setConfig((c) => ({ ...c, stream: v }))}
                />
              </div>
            </div>

            {/* Provider-specific config */}
            {config.providerMode === 'custom' && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Server className="h-4 w-4 text-blue-500" />
                    <h3 className="font-semibold text-sm">Custom Provider</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Base URL</Label>
                      <Input
                        placeholder="http://localhost:8000/v1"
                        value={customConfig.baseURL}
                        onChange={(e) =>
                          setCustomConfig((c) => ({ ...c, baseURL: e.target.value }))
                        }
                        className="h-9 bg-muted/50 border-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">API Key</Label>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={customConfig.apiKey}
                        onChange={(e) =>
                          setCustomConfig((c) => ({ ...c, apiKey: e.target.value }))
                        }
                        className="h-9 bg-muted/50 border-0"
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
                  <div className="flex items-center gap-2 mb-4">
                    <Box className="h-4 w-4 text-indigo-500" />
                    <h3 className="font-semibold text-sm">Sandbox</h3>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Domain</Label>
                    <Input
                      placeholder="sandbox-xxx.vercel.app"
                      value={sandboxConfig.domain}
                      onChange={(e) =>
                        setSandboxConfig((c) => ({ ...c, domain: e.target.value }))
                      }
                      className="h-9 bg-muted/50 border-0"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
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
