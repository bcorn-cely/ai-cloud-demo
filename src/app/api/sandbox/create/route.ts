import { NextResponse } from 'next/server';
import { Sandbox } from '@vercel/sandbox';

// Store active sandbox reference (in production, use a proper store)
let activeSandbox: Sandbox | null = null;

const MOCK_SERVER_CODE = `
import { createServer } from 'http';

const PORT = process.env.PORT || 8080;

const server = createServer((req, res) => {
  console.log(\`\${req.method} \${req.url}\`);

  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { messages, model } = JSON.parse(body);
        const lastMessage = messages[messages.length - 1];

        const response = {
          id: 'chatcmpl-' + Math.random().toString(36).slice(2),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: model || 'mock-gpt-4',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: \`[Sandbox Mock] You said: "\${lastMessage.content.slice(0, 100)}"\n\nThis is a real response from a Vercel Sandbox running a mock OpenAI-compatible server.\`,
            },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: Math.ceil(lastMessage.content.length / 4),
            completion_tokens: 50,
            total_tokens: Math.ceil(lastMessage.content.length / 4) + 50,
          },
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
  } else if (req.url === '/v1/models') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      object: 'list',
      data: [
        { id: 'mock-gpt-4', object: 'model', created: Date.now(), owned_by: 'vercel-sandbox' },
        { id: 'mock-claude', object: 'model', created: Date.now(), owned_by: 'vercel-sandbox' },
        { id: 'mock-llama', object: 'model', created: Date.now(), owned_by: 'vercel-sandbox' },
      ],
    }));
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(\`Mock OpenAI server running on port \${PORT}\`);
  console.log('Available endpoints:');
  console.log('  POST /v1/chat/completions');
  console.log('  GET  /v1/models');
  console.log('  GET  /health');
});
`;

const PACKAGE_JSON = JSON.stringify({
  name: 'mock-openai-server',
  type: 'module',
  scripts: {
    start: 'node server.mjs'
  }
}, null, 2);

export async function POST() {
  const logs: string[] = [];

  try {
    // Check if sandbox credentials are available
    const hasCredentials = process.env.VERCEL_OIDC_TOKEN;

    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        error: 'Sandbox credentials not configured',
        message: 'Add VERCEL_OIDC_TOKEN to your .env.local file, or deploy to Vercel for automatic OIDC authentication.',
        logs: ['Error: No Vercel credentials found'],
      }, { status: 401 });
    }

    logs.push('Creating Vercel Sandbox...');

    // Create the sandbox with port 8080 exposed
    const sandbox = await Sandbox.create({
      runtime: 'node24',
      ports: [8080],
    });

    activeSandbox = sandbox;
    logs.push(`Sandbox created: ${sandbox.sandboxId}`);

    // Write the mock server files
    logs.push('Writing mock server code...');
    await sandbox.writeFiles([
      { path: 'server.mjs', content: Buffer.from(MOCK_SERVER_CODE) },
      { path: 'package.json', content: Buffer.from(PACKAGE_JSON) },
    ]);
    logs.push('Files written successfully');

    // Start the server in detached mode
    logs.push('Starting mock OpenAI server...');
    const command = await sandbox.runCommand({
      cmd: 'node',
      args: ['server.mjs'],
      detached: true,
    });
    logs.push('Server process started in detached mode');

    // Get the domain for port 8080
    const domain = sandbox.domain(8080);
    logs.push(`Server available at: ${domain}`);

    return NextResponse.json({
      success: true,
      sandboxId: sandbox.sandboxId,
      domain,
      logs,
    });
  } catch (error) {
    console.error('Sandbox creation error:', error);
    logs.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sandbox',
      logs,
    }, { status: 500 });
  }
}

export async function DELETE() {
  const logs: string[] = [];

  try {
    if (!activeSandbox) {
      return NextResponse.json({
        success: false,
        error: 'No active sandbox to stop',
        logs: ['No sandbox is currently running'],
      }, { status: 404 });
    }

    logs.push('Stopping sandbox...');
    await activeSandbox.stop();
    logs.push(`Sandbox ${activeSandbox.sandboxId} stopped`);

    activeSandbox = null;

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('Sandbox stop error:', error);
    logs.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop sandbox',
      logs,
    }, { status: 500 });
  }
}
