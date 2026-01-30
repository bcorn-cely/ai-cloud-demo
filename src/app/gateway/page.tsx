'use client';

import { useState, useEffect } from 'react';
import { Search, RefreshCw, Copy, Check, Code, Database, Sparkles } from 'lucide-react';
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
import { JsonTreeView } from '@/components/ui/code-block';
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Model Explorer</h1>
              <p className="text-sm text-muted-foreground">
                {models.length} models available via AI Gateway
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Models List */}
          <div className="space-y-4">
            {/* Filters */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search models..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 bg-muted/50 border-0"
                      />
                    </div>
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[130px] h-10 bg-muted/50 border-0">
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
                    <SelectTrigger className="w-[140px] h-10 bg-muted/50 border-0">
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {owners.map((owner) => (
                        <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={fetchModels}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Models Table */}
            <Card className="border-0 shadow-lg shadow-black/5">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold">Model</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Context</TableHead>
                      <TableHead className="text-xs font-semibold text-right">$/1M input</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModels.map((model) => (
                      <TableRow
                        key={model.id}
                        className={`cursor-pointer transition-colors ${
                          selectedModel?.id === model.id
                            ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedModel(model)}
                      >
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{model.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium">
                            {model.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {model.context_window ? `${(model.context_window / 1000).toFixed(0)}K` : '-'}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground text-right font-mono">
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
              <Card className="border-0 shadow-lg shadow-black/5 sticky top-6">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg truncate">{selectedModel.id}</CardTitle>
                      <CardDescription className="text-sm">{selectedModel.owned_by}</CardDescription>
                    </div>
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0">
                          <Code className="h-4 w-4 mr-1.5" />
                          JSON
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[500px] sm:max-w-[500px]">
                        <SheetHeader>
                          <SheetTitle>Raw API Data</SheetTitle>
                          <SheetDescription>Model and endpoint responses</SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <Tabs defaultValue="model">
                            <TabsList className="w-full">
                              <TabsTrigger value="model" className="flex-1">Model</TabsTrigger>
                              <TabsTrigger value="endpoints" className="flex-1">Endpoints</TabsTrigger>
                              <TabsTrigger value="all" className="flex-1">All Models</TabsTrigger>
                            </TabsList>

                            <TabsContent value="model" className="mt-4">
                              <JsonTreeView data={selectedModel} maxHeight="calc(100vh - 280px)" />
                            </TabsContent>

                            <TabsContent value="endpoints" className="mt-4">
                              <div className="mb-3">
                                <code className="text-xs text-muted-foreground">
                                  /v1/models/{selectedModel.id}/endpoints
                                </code>
                              </div>
                              {loadingEndpoints ? (
                                <div className="flex items-center justify-center h-32 rounded-xl border border-zinc-800 bg-zinc-950">
                                  <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : (
                                <JsonTreeView data={endpoints || {}} maxHeight="calc(100vh - 320px)" />
                              )}
                            </TabsContent>

                            <TabsContent value="all" className="mt-4">
                              <JsonTreeView data={modelsRaw || {}} maxHeight="calc(100vh - 280px)" />
                            </TabsContent>
                          </Tabs>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {selectedModel.description && (
                    <p className="text-sm text-muted-foreground">{selectedModel.description}</p>
                  )}

                  {selectedModel.tags && selectedModel.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedModel.tags.slice(0, 6).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-medium">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Context Window</p>
                      <p className="font-semibold">{selectedModel.context_window?.toLocaleString() || '-'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Max Output</p>
                      <p className="font-semibold">{selectedModel.max_tokens?.toLocaleString() || '-'}</p>
                    </div>
                  </div>

                  {selectedModel.pricing && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Pricing (per 1M tokens)
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-emerald-500/10">
                            <p className="text-xs text-muted-foreground mb-1">Input</p>
                            <p className="font-semibold text-emerald-600">${(parseFloat(selectedModel.pricing.input) * 1000000).toFixed(2)}</p>
                          </div>
                          {selectedModel.pricing.output && (
                            <div className="p-3 rounded-xl bg-blue-500/10">
                              <p className="text-xs text-muted-foreground mb-1">Output</p>
                              <p className="font-semibold text-blue-600">${(parseFloat(selectedModel.pricing.output) * 1000000).toFixed(2)}</p>
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
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          {endpoints.data.endpoints.length} Provider{endpoints.data.endpoints.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {endpoints.data.endpoints.map((ep, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs font-medium">
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
              <Card className="border-0 shadow-lg shadow-black/5">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-blue-500/70" />
                  </div>
                  <p className="font-medium mb-1">Select a model</p>
                  <p className="text-sm text-muted-foreground">Click on any model to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
