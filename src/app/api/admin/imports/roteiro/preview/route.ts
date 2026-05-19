import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const workspaceRoot = process.cwd();
const importDir = path.join(workspaceRoot, 'scripts', 'json-imports', 'roteiro-comercial');
const previewPath = path.join(importDir, 'preview-cache.json');
const scriptPath = path.join(importDir, 'import-roteiro-comercial.mjs');

export async function GET() {
  if (!fs.existsSync(previewPath)) {
    return NextResponse.json({ exists: false, preview: null });
  }

  const preview = JSON.parse(fs.readFileSync(previewPath, 'utf8'));
  return NextResponse.json({ exists: true, preview });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const limit = typeof body?.limit === 'number' && body.limit > 0 ? body.limit : null;
  const googleLookup = body?.googleLookup === true;
  const args = [scriptPath, '--dry-run', '--json'];
  args.push('--fast-preview');
  if (!googleLookup) {
    args.push('--skip-google');
  }
  if (limit) {
    args.push(`--limit=${limit}`);
  }

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, args, {
      cwd: workspaceRoot,
      maxBuffer: 1024 * 1024 * 100,
    });

    const parsed = JSON.parse(stdout);
    return NextResponse.json({
      ok: true,
      preview: parsed,
      stderr: stderr || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
