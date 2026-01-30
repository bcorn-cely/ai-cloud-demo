'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, Copy, Check, Code, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import type { GatewayModel, ModelEndpointsResponse } from '@/types';

export default function GatewayPage() {
  const [models, setModels] = useState<GatewayModel[]>([]);
  const [modelsRaw, setModelsRaw] = useState<object | null>(null);
  const [filteredModels, setFilteredModels] = useState<GatewayModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<GatewayModel | null>(null);
  const [endpoints, setEndpoints] = useState<ModelEndpointsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEndpoints, setLoadingEndpoints] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    let filtered = models;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.id.toLowerCase().includes(searchLower) ||
          m.name?.toLowerCase().includes(searchLower)
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
      setModelsRaw(data);
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

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const owners = [...new Set(models.map((m) => m.owned_by))].sort();

  return (
    <div className="container mx-auto px-6 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Model Explorer</h1>
        <p className="text-sm text-muted-foreground">
          {models.length} models available via AI Gateway
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Models List */}
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[110px] h-8 text-sm">
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
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {owners.map((owner) => (
                  <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchModels} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Models Table */}
          <Card>
            <ScrollArea className="h-[calc(100vh-220px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Model</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Context</TableHead>
                    <TableHead className="text-xs">$/1M in</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map((model) => (
                    <TableRow
                      key={model.id}
                      className={`cursor-pointer ${selectedModel?.id === model.id ? 'bg-muted' : ''}`}
                      onClick={() => setSelectedModel(model)}
                    >
                      <TableCell className="py-2">
                        <span className="text-sm font-medium">{model.id}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          {model.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {model.context_window ? `${(model.context_window / 1000).toFixed(0)}K` : '-'}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {model.pricing ? `$${(parseFloat(model.pricing.input) * 1000000).toFixed(2)}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </div>

        {/* Model Details */}
        <div>
          {selectedModel ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{selectedModel.id}</CardTitle>
                    <CardDescription className="text-xs">{selectedModel.owned_by}</CardDescription>
                  </div>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="shrink-0 h-7 text-xs">
                        <Code className="h-3 w-3 mr-1" />
                        JSON
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[500px] sm:max-w-[500px]">
                      <SheetHeader>
                        <SheetTitle>Raw API Data</SheetTitle>
                        <SheetDescription>Model and endpoint responses</SheetDescription>
                      </SheetHeader>
                      <div className="mt-4">
                        <Tabs defaultValue="model">
                          <TabsList className="w-full">
                            <TabsTrigger value="model" className="flex-1">Model</TabsTrigger>
                            <TabsTrigger value="endpoints" className="flex-1">Endpoints</TabsTrigger>
                            <TabsTrigger value="all" className="flex-1">All Models</TabsTrigger>
                          </TabsList>

                          <TabsContent value="model" className="mt-3">
                            <div className="flex justify-end mb-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(selectedModel, null, 2), 'model-json')}
                              >
                                {copied === 'model-json' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                Copy
                              </Button>
                            </div>
                            <ScrollArea className="h-[calc(100vh-250px)] rounded-lg border bg-muted/30 p-3">
                              <JsonView data={selectedModel} shouldExpandNode={allExpanded} style={defaultStyles} />
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent value="endpoints" className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <code className="text-[10px] text-muted-foreground truncate">
                                /v1/models/{selectedModel.id}/endpoints
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(endpoints, null, 2), 'endpoints-json')}
                                disabled={!endpoints}
                              >
                                {copied === 'endpoints-json' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                Copy
                              </Button>
                            </div>
                            <ScrollArea className="h-[calc(100vh-250px)] rounded-lg border bg-muted/30 p-3">
                              {loadingEndpoints ? (
                                <div className="flex items-center justify-center h-32">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                <JsonView data={endpoints || {}} shouldExpandNode={allExpanded} style={defaultStyles} />
                              )}
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent value="all" className="mt-3">
                            <div className="flex justify-end mb-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(modelsRaw, null, 2), 'all-json')}
                              >
                                {copied === 'all-json' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                Copy
                              </Button>
                            </div>
                            <ScrollArea className="h-[calc(100vh-250px)] rounded-lg border bg-muted/30 p-3">
                              <JsonView data={modelsRaw || {}} shouldExpandNode={allExpanded} style={defaultStyles} />
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedModel.description && (
                  <p className="text-xs text-muted-foreground">{selectedModel.description}</p>
                )}

                {selectedModel.tags && selectedModel.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedModel.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Context</p>
                    <p className="font-medium">{selectedModel.context_window?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Max Output</p>
                    <p className="font-medium">{selectedModel.max_tokens?.toLocaleString() || '-'}</p>
                  </div>
                </div>

                {selectedModel.pricing && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-2">Pricing (per 1M tokens)</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Input</p>
                          <p className="font-medium">${(parseFloat(selectedModel.pricing.input) * 1000000).toFixed(2)}</p>
                        </div>
                        {selectedModel.pricing.output && (
                          <div>
                            <p className="text-[10px] text-muted-foreground">Output</p>
                            <p className="font-medium">${(parseFloat(selectedModel.pricing.output) * 1000000).toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Endpoints summary inline */}
                {endpoints?.data?.endpoints && endpoints.data.endpoints.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase mb-2">
                        {endpoints.data.endpoints.length} Provider{endpoints.data.endpoints.length > 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {endpoints.data.endpoints.map((ep, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {ep.provider_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Database className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Select a model</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
