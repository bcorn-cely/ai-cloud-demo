'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronRight, Copy, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import type { GatewayModel, ModelEndpointsResponse } from '@/types';

export default function GatewayPage() {
  const [models, setModels] = useState<GatewayModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<GatewayModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<GatewayModel | null>(null);
  const [endpoints, setEndpoints] = useState<ModelEndpointsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEndpoints, setLoadingEndpoints] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, []);

  // Filter models when search or filters change
  useEffect(() => {
    let filtered = models;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.id.toLowerCase().includes(searchLower) ||
          m.name?.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((m) => m.type === typeFilter);
    }

    if (ownerFilter !== 'all') {
      filtered = filtered.filter((m) => m.owned_by === ownerFilter);
    }

    setFilteredModels(filtered);
  }, [models, search, typeFilter, ownerFilter]);

  // Fetch endpoints when model is selected
  useEffect(() => {
    if (selectedModel) {
      fetchEndpoints(selectedModel.id);
    }
  }, [selectedModel]);

  async function fetchModels() {
    setLoading(true);
    try {
      const response = await fetch('/api/gateway/models');
      const data = await response.json();
      setModels(data.data || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEndpoints(modelId: string) {
    setLoadingEndpoints(true);
    try {
      const response = await fetch(`/api/gateway/endpoints?modelId=${encodeURIComponent(modelId)}`);
      const data = await response.json();
      setEndpoints(data);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
      setEndpoints(null);
    } finally {
      setLoadingEndpoints(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Get unique owners for filter
  const owners = [...new Set(models.map((m) => m.owned_by))].sort();

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">AI Gateway Model Explorer</h1>
        <p className="text-muted-foreground mt-1">
          Browse available models, view pricing, and discover provider endpoints
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Models List */}
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search models..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                    <SelectItem value="embedding">Embedding</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {owners.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchModels} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>
                  Showing {filteredModels.length} of {models.length} models
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Models Table */}
          <Card>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead>Pricing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((model) => (
                    <TableRow
                      key={model.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedModel?.id === model.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedModel(model)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{model.id}</span>
                          <span className="text-xs text-muted-foreground">{model.owned_by}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {model.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {model.context_window
                            ? `${(model.context_window / 1000).toFixed(0)}K`
                            : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {model.pricing ? (
                          <span className="text-xs text-muted-foreground">
                            ${(parseFloat(model.pricing.input) * 1000000).toFixed(2)}/1M
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>

        {/* Model Details Panel */}
        <div className="space-y-4">
          {selectedModel ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedModel.name || selectedModel.id}</CardTitle>
                      <CardDescription>{selectedModel.id}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(selectedModel.id)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedModel.description && (
                      <p className="text-sm text-muted-foreground">{selectedModel.description}</p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {selectedModel.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Context Window</p>
                        <p className="font-medium">
                          {selectedModel.context_window?.toLocaleString()} tokens
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Max Output</p>
                        <p className="font-medium">
                          {selectedModel.max_tokens?.toLocaleString()} tokens
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{selectedModel.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Provider</p>
                        <p className="font-medium">{selectedModel.owned_by}</p>
                      </div>
                    </div>

                    {selectedModel.pricing && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-2">Pricing (per 1M tokens)</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Input</p>
                              <p className="font-medium">
                                ${(parseFloat(selectedModel.pricing.input) * 1000000).toFixed(2)}
                              </p>
                            </div>
                            {selectedModel.pricing.output && (
                              <div>
                                <p className="text-muted-foreground">Output</p>
                                <p className="font-medium">
                                  ${(parseFloat(selectedModel.pricing.output) * 1000000).toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Endpoints */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Provider Endpoints</CardTitle>
                  <CardDescription>Available providers for this model</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingEndpoints ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    </div>
                  ) : endpoints?.data?.endpoints ? (
                    <div className="space-y-3">
                      {endpoints.data.endpoints.map((endpoint, idx) => (
                        <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{endpoint.provider_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {endpoint.context_length?.toLocaleString()} ctx
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {endpoint.supported_parameters?.slice(0, 5).map((param) => (
                              <Badge key={param} variant="secondary" className="text-[10px]">
                                {param}
                              </Badge>
                            ))}
                            {endpoint.supported_parameters?.length > 5 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{endpoint.supported_parameters.length - 5}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${(parseFloat(endpoint.pricing.prompt) * 1000000).toFixed(2)}/1M in |{' '}
                            ${(parseFloat(endpoint.pricing.completion) * 1000000).toFixed(2)}/1M out
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No endpoints available</p>
                  )}
                </CardContent>
              </Card>

              {/* JSON View */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Raw JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="model">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="model">Model</TabsTrigger>
                      <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                    </TabsList>
                    <TabsContent value="model" className="mt-3">
                      <ScrollArea className="h-[300px] rounded-lg border bg-muted/30 p-4">
                        <JsonView
                          data={selectedModel}
                          shouldExpandNode={allExpanded}
                          style={defaultStyles}
                        />
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="endpoints" className="mt-3">
                      <ScrollArea className="h-[300px] rounded-lg border bg-muted/30 p-4">
                        <JsonView
                          data={endpoints || {}}
                          shouldExpandNode={allExpanded}
                          style={defaultStyles}
                        />
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ChevronRight className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Select a model to view details and endpoints
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Code Snippets */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Quick Code Snippets</CardTitle>
          <CardDescription>Copy-paste examples for using AI Gateway</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sdk">
            <TabsList>
              <TabsTrigger value="sdk">AI SDK</TabsTrigger>
              <TabsTrigger value="fetch">Fetch</TabsTrigger>
              <TabsTrigger value="discovery">Discovery</TabsTrigger>
            </TabsList>
            <TabsContent value="sdk" className="mt-3">
              <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
{`import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

const { text } = await generateText({
  model: gateway('${selectedModel?.id || 'anthropic/claude-sonnet-4'}'),
  prompt: 'Hello, world!',
});`}
              </pre>
            </TabsContent>
            <TabsContent value="fetch" className="mt-3">
              <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
{`const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer \${AI_GATEWAY_API_KEY}',
  },
  body: JSON.stringify({
    model: '${selectedModel?.id || 'anthropic/claude-sonnet-4'}',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
});`}
              </pre>
            </TabsContent>
            <TabsContent value="discovery" className="mt-3">
              <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
{`// Fetch all models
const models = await fetch('https://ai-gateway.vercel.sh/v1/models');

// Fetch endpoints for a specific model
const endpoints = await fetch(
  'https://ai-gateway.vercel.sh/v1/models/${selectedModel?.id.split('/')[0] || 'anthropic'}/${selectedModel?.id.split('/').slice(1).join('/') || 'claude-sonnet-4'}/endpoints'
);`}
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
