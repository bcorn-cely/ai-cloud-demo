'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Download,
  Trash2,
  Clock,
  DollarSign,
  FileJson,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import type { TraceRecord } from '@/ai/telemetry';

// Demo traces for when no real traces exist
const DEMO_TRACES: TraceRecord[] = [
  {
    traceId: 'tr_demo1',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    providerMode: 'gateway',
    model: 'anthropic/claude-sonnet-4',
    requestPayload: {
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      temperature: 0.7,
      maxTokens: 1024,
    },
    response: {
      text: "I'm doing well, thank you for asking! How can I help you today?",
      finishReason: 'stop',
      usage: { promptTokens: 12, completionTokens: 18, totalTokens: 30 },
    },
    latencyMs: 1234,
    startTime: new Date(Date.now() - 61234).toISOString(),
    endTime: new Date(Date.now() - 60000).toISOString(),
    pricing: { input: '0.000003', output: '0.000015' },
    estimatedCost: { inputCost: 0.000036, outputCost: 0.00027, totalCost: 0.000306, currency: 'USD' },
    config: { byokApplied: false },
  },
  {
    traceId: 'tr_demo2',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    providerMode: 'gateway',
    model: 'openai/gpt-4o',
    requestPayload: {
      messages: [{ role: 'user', content: 'Write a haiku about coding' }],
      temperature: 0.9,
      maxTokens: 256,
    },
    response: {
      text: 'Code flows like water\nBugs hide in the deep shadows\nTests bring the light back',
      finishReason: 'stop',
      usage: { promptTokens: 8, completionTokens: 22, totalTokens: 30 },
    },
    latencyMs: 987,
    startTime: new Date(Date.now() - 120987).toISOString(),
    endTime: new Date(Date.now() - 120000).toISOString(),
    pricing: { input: '0.000005', output: '0.000015' },
    estimatedCost: { inputCost: 0.00004, outputCost: 0.00033, totalCost: 0.00037, currency: 'USD' },
    config: { byokApplied: true, byokProvider: 'openai' },
  },
  {
    traceId: 'tr_demo3',
    timestamp: new Date(Date.now() - 180000).toISOString(),
    providerMode: 'custom',
    model: 'llama-3-70b',
    requestPayload: {
      messages: [{ role: 'user', content: 'Explain quantum computing' }],
      temperature: 0.5,
      maxTokens: 2048,
    },
    response: {
      text: 'Quantum computing uses quantum mechanics principles...',
      finishReason: 'stop',
      usage: { promptTokens: 6, completionTokens: 150, totalTokens: 156 },
    },
    latencyMs: 2345,
    startTime: new Date(Date.now() - 182345).toISOString(),
    endTime: new Date(Date.now() - 180000).toISOString(),
    config: { baseURL: 'http://localhost:8000/v1', byokApplied: false },
  },
];

export default function TracesPage() {
  const [traces, setTraces] = useState<TraceRecord[]>(DEMO_TRACES);
  const [selectedTrace, setSelectedTrace] = useState<TraceRecord | null>(null);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const filteredTraces =
    providerFilter === 'all'
      ? traces
      : traces.filter((t) => t.providerMode === providerFilter);

  // Calculate stats
  const stats = {
    totalTraces: traces.length,
    totalTokens: traces.reduce((sum, t) => sum + (t.response.usage?.totalTokens || 0), 0),
    totalCost: traces.reduce((sum, t) => sum + (t.estimatedCost?.totalCost || 0), 0),
    avgLatency: traces.length > 0
      ? traces.reduce((sum, t) => sum + t.latencyMs, 0) / traces.length
      : 0,
  };

  // Prepare chart data
  const chartData = traces
    .slice(0, 10)
    .reverse()
    .map((t, i) => ({
      name: `#${i + 1}`,
      latency: t.latencyMs,
      tokens: t.response.usage?.totalTokens || 0,
      cost: (t.estimatedCost?.totalCost || 0) * 1000, // Scale for visibility
    }));

  async function refreshTraces() {
    setLoading(true);
    // In real app, fetch from API
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
  }

  function clearTraces() {
    setTraces([]);
    setSelectedTrace(null);
  }

  function exportTraces() {
    const json = JSON.stringify(traces, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traces-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatCost(cost: number): string {
    if (cost === 0) return '$0.00';
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    return `$${cost.toFixed(4)}`;
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request Traces</h1>
          <p className="text-muted-foreground mt-1">
            View request telemetry, latency, and cost estimation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshTraces} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportTraces}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={clearTraces}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Traces</p>
                <p className="text-2xl font-bold">{stats.totalTraces}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileJson className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Est. Cost</p>
                <p className="text-2xl font-bold">{formatCost(stats.totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Latency</p>
                <p className="text-2xl font-bold">{Math.round(stats.avgLatency)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {traces.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Latency Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="latency"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tokens per Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="tokens" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Traces Table and Detail */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Trace History</CardTitle>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="gateway">Gateway</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trace ID</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTraces.map((trace) => (
                    <TableRow
                      key={trace.traceId}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        selectedTrace?.traceId === trace.traceId ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedTrace(trace)}
                    >
                      <TableCell>
                        <code className="text-xs">{trace.traceId}</code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[150px] block">
                          {trace.model}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {trace.providerMode}
                        </Badge>
                      </TableCell>
                      <TableCell>{trace.latencyMs}ms</TableCell>
                      <TableCell>{trace.response.usage?.totalTokens || '-'}</TableCell>
                      <TableCell>
                        {trace.estimatedCost
                          ? formatCost(trace.estimatedCost.totalCost)
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Trace Detail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trace Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrace ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Trace ID</p>
                      <code className="text-xs">{selectedTrace.traceId}</code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Timestamp</p>
                      <p className="text-sm">
                        {new Date(selectedTrace.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Latency</p>
                      <p className="text-sm font-medium">{selectedTrace.latencyMs}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tokens</p>
                      <p className="text-sm font-medium">
                        {selectedTrace.response.usage?.totalTokens || '-'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {selectedTrace.estimatedCost && (
                    <>
                      <div>
                        <p className="text-sm font-medium mb-2">Cost Breakdown</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded bg-muted">
                            <p className="text-muted-foreground">Input</p>
                            <p className="font-medium">
                              {formatCost(selectedTrace.estimatedCost.inputCost)}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-muted">
                            <p className="text-muted-foreground">Output</p>
                            <p className="font-medium">
                              {formatCost(selectedTrace.estimatedCost.outputCost)}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-muted">
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-medium">
                              {formatCost(selectedTrace.estimatedCost.totalCost)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Request Payload</p>
                    <div className="rounded-lg border bg-muted/30 p-2">
                      <JsonView
                        data={selectedTrace.requestPayload}
                        shouldExpandNode={allExpanded}
                        style={defaultStyles}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Response</p>
                    <div className="rounded-lg border bg-muted/30 p-2">
                      <JsonView
                        data={selectedTrace.response}
                        shouldExpandNode={allExpanded}
                        style={defaultStyles}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Configuration</p>
                    <div className="rounded-lg border bg-muted/30 p-2">
                      <JsonView
                        data={selectedTrace.config}
                        shouldExpandNode={allExpanded}
                        style={defaultStyles}
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <ChevronRight className="h-8 w-8 mb-2" />
                <p className="text-sm">Select a trace to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
