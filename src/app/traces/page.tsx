'use client';

import { useState } from 'react';
import {
  Activity,
  RefreshCw,
  Download,
  Trash2,
  Clock,
  DollarSign,
  FileJson,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { JsonTreeView } from '@/components/ui/code-block';
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
      cost: (t.estimatedCost?.totalCost || 0) * 1000,
    }));

  async function refreshTraces() {
    setLoading(true);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/25">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Request Traces</h1>
              <p className="text-sm text-muted-foreground">
                View request telemetry, latency, and cost estimation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshTraces} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportTraces}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={clearTraces}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[
            { icon: Activity, label: 'Total Traces', value: stats.totalTraces, color: 'text-fuchsia-500' },
            { icon: FileJson, label: 'Total Tokens', value: stats.totalTokens.toLocaleString(), color: 'text-blue-500' },
            { icon: DollarSign, label: 'Est. Cost', value: formatCost(stats.totalCost), color: 'text-emerald-500' },
            { icon: Clock, label: 'Avg Latency', value: `${Math.round(stats.avgLatency)}ms`, color: 'text-amber-500' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-lg shadow-black/5">
              <CardContent className="pt-5">
                <div className="flex items-center gap-4">
                  <div className={`${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        {traces.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Latency Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" fontSize={12} className="fill-muted-foreground" />
                      <YAxis fontSize={12} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="latency"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg shadow-black/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tokens per Request</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" fontSize={12} className="fill-muted-foreground" />
                      <YAxis fontSize={12} className="fill-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="tokens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Traces Table and Detail */}
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Trace History</CardTitle>
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-muted/50 border-0">
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
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold">Trace ID</TableHead>
                      <TableHead className="text-xs font-semibold">Model</TableHead>
                      <TableHead className="text-xs font-semibold">Provider</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Latency</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Tokens</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTraces.map((trace) => (
                      <TableRow
                        key={trace.traceId}
                        className={`cursor-pointer transition-colors ${
                          selectedTrace?.traceId === trace.traceId
                            ? 'bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedTrace(trace)}
                      >
                        <TableCell className="py-3">
                          <code className="text-xs font-mono">{trace.traceId}</code>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-sm truncate max-w-[150px] block">
                            {trace.model}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-xs font-medium">
                            {trace.providerMode}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-right font-mono">
                          {trace.latencyMs}ms
                        </TableCell>
                        <TableCell className="py-3 text-sm text-right">
                          {trace.response.usage?.totalTokens || '-'}
                        </TableCell>
                        <TableCell className="py-3 text-sm text-right font-mono">
                          {trace.estimatedCost ? formatCost(trace.estimatedCost.totalCost) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Trace Detail */}
          <Card className="border-0 shadow-lg shadow-black/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Trace Details</CardTitle>
              <CardDescription>
                {selectedTrace ? (
                  <code className="text-xs font-mono">{selectedTrace.traceId}</code>
                ) : (
                  'Select a trace to view details'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTrace ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Timestamp', value: new Date(selectedTrace.timestamp).toLocaleString() },
                        { label: 'Latency', value: `${selectedTrace.latencyMs}ms` },
                        { label: 'Model', value: selectedTrace.model },
                        { label: 'Tokens', value: selectedTrace.response.usage?.totalTokens || '-' },
                      ].map((item) => (
                        <div key={item.label} className="p-3 rounded-xl bg-muted/30">
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium truncate">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedTrace.estimatedCost && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Cost Breakdown
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'Input', value: formatCost(selectedTrace.estimatedCost.inputCost), color: 'bg-emerald-500/10 text-emerald-600' },
                              { label: 'Output', value: formatCost(selectedTrace.estimatedCost.outputCost), color: 'bg-blue-500/10 text-blue-600' },
                              { label: 'Total', value: formatCost(selectedTrace.estimatedCost.totalCost), color: 'bg-fuchsia-500/10 text-fuchsia-600' },
                            ].map((item) => (
                              <div key={item.label} className={`p-3 rounded-xl ${item.color}`}>
                                <p className="text-xs opacity-70">{item.label}</p>
                                <p className="font-semibold">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Request Payload
                      </p>
                      <JsonTreeView data={selectedTrace.requestPayload} maxHeight="200px" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Response
                      </p>
                      <JsonTreeView data={selectedTrace.response} maxHeight="200px" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Configuration
                      </p>
                      <JsonTreeView data={selectedTrace.config} maxHeight="150px" />
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-fuchsia-500/70" />
                  </div>
                  <p className="font-medium mb-1">No trace selected</p>
                  <p className="text-sm">Click on any trace to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
