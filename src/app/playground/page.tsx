'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Send,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Zap,
  Server,
  Box,
  Clock,
  FileJson,
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
  const [copied, setCopied] = useState(false);
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

      if (config.stream) {
        // Handle streaming response
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
          const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text-delta' || data.textDelta) {
                assistantContent += data.textDelta || data.content || '';
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            } catch {
              // Ignore parsing errors for partial chunks
            }
          }
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select
              value={config.providerMode}
              onValueChange={(v) => setConfig((c) => ({ ...c, providerMode: v as ProviderMode }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gateway">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Gateway
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Self-Hosted
                  </div>
                </SelectItem>
                <SelectItem value="sandbox">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Sandbox Mock
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={config.model}
              onValueChange={(v) => setConfig((c) => ({ ...c, model: v }))}
            >
              <SelectTrigger className="w-[280px]">
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
            <Badge variant="outline" className="text-xs">
              {config.providerMode}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearChat}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium mb-2">Start a conversation</p>
                <p className="text-sm">
                  Chat with {config.model} via {config.providerMode}
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

      {/* Right Panel */}
      <div className="w-[400px] border-l flex flex-col">
        <Tabs defaultValue="config" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b px-4 pt-4">
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="trace">Trace</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="config" className="mt-0 p-4 space-y-6">
              {/* Model Settings */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Model Settings</h3>

                <div className="space-y-2">
                  <Label>Temperature: {config.temperature}</Label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, temperature: parseFloat(e.target.value) }))
                    }
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Tokens: {config.maxTokens}</Label>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={config.maxTokens}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, maxTokens: parseInt(e.target.value) }))
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="tools">Enable Tools</Label>
                  <Switch
                    id="tools"
                    checked={config.tools}
                    onCheckedChange={(v) => setConfig((c) => ({ ...c, tools: v }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="stream">Streaming</Label>
                  <Switch
                    id="stream"
                    checked={config.stream}
                    onCheckedChange={(v) => setConfig((c) => ({ ...c, stream: v }))}
                  />
                </div>
              </div>

              <Separator />

              {/* Provider-specific config */}
              {config.providerMode === 'custom' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Custom Provider</h3>
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input
                      placeholder="http://localhost:8000/v1"
                      value={customConfig.baseURL}
                      onChange={(e) =>
                        setCustomConfig((c) => ({ ...c, baseURL: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Key (optional)</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={customConfig.apiKey}
                      onChange={(e) =>
                        setCustomConfig((c) => ({ ...c, apiKey: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              {config.providerMode === 'sandbox' && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Sandbox Provider</h3>
                  <div className="space-y-2">
                    <Label>Sandbox Domain</Label>
                    <Input
                      placeholder="https://sandbox-xxx.vercel.app"
                      value={sandboxConfig.domain}
                      onChange={(e) =>
                        setSandboxConfig((c) => ({ ...c, domain: e.target.value }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Start a sandbox from the Sandbox page to get a domain
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="request" className="mt-0 p-4">
              <h3 className="font-medium text-sm mb-3">Request Payload</h3>
              {requestPayload ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <JsonView
                    data={requestPayload}
                    shouldExpandNode={allExpanded}
                    style={defaultStyles}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Send a message to see the request payload
                </p>
              )}
            </TabsContent>

            <TabsContent value="response" className="mt-0 p-4">
              <h3 className="font-medium text-sm mb-3">Response Data</h3>
              {responseData ? (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <JsonView
                    data={responseData}
                    shouldExpandNode={allExpanded}
                    style={defaultStyles}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Response data will appear here
                </p>
              )}
            </TabsContent>

            <TabsContent value="trace" className="mt-0 p-4">
              <h3 className="font-medium text-sm mb-3">Request Trace</h3>
              {requestInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Latency</p>
                            <p className="font-medium">
                              {requestInfo.latencyMs ? `${requestInfo.latencyMs}ms` : '...'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Trace ID</p>
                            <code className="text-xs">{requestInfo.traceId.slice(0, 8)}...</code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                <p className="text-sm text-muted-foreground">
                  Trace information will appear here after a request
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
