import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const workspaceRoot = process.cwd();
const importDir = path.join(workspaceRoot, 'scripts', 'json-imports', 'roteiro-comercial');
const approvalsPath = path.join(importDir, 'approvals.json');
const previewPath = path.join(importDir, 'preview-cache.json');
const scriptPath = path.join(importDir, 'import-roteiro-comercial.mjs');
const execFileAsync = promisify(execFile);

type ApprovalState = {
  approvedSourceIds: string[];
  excludedSourceIds: string[];
  updatedAt: string | null;
};

type PreviewRecord = {
  sourceId: string;
  invalid?: boolean;
  environment?: {
    source?: string;
  };
};

function readApprovals(): ApprovalState {
  if (!fs.existsSync(approvalsPath)) {
    return { approvedSourceIds: [], excludedSourceIds: [], updatedAt: null };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(approvalsPath, 'utf8'));
    return {
      approvedSourceIds: Array.isArray(parsed?.approvedSourceIds) ? parsed.approvedSourceIds.map(String) : [],
      excludedSourceIds: Array.isArray(parsed?.excludedSourceIds) ? parsed.excludedSourceIds.map(String) : [],
      updatedAt: parsed?.updatedAt || null,
    };
  } catch {
    return { approvedSourceIds: [], excludedSourceIds: [], updatedAt: null };
  }
}

function writeApprovals(approvedSourceIds: string[], excludedSourceIds: string[] = []): ApprovalState {
  const payload: ApprovalState = {
    approvedSourceIds: [...new Set(approvedSourceIds.map(String))],
    excludedSourceIds: [...new Set(excludedSourceIds.map(String))],
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(approvalsPath, JSON.stringify(payload, null, 2));
  return payload;
}

function readPreviewRecords(): unknown[] {
  if (!fs.existsSync(previewPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(previewPath, 'utf8'));
    return Array.isArray(parsed?.reviewRecords) ? parsed.reviewRecords : [];
  } catch {
    return [];
  }
}

function isValidPreviewRecord(record: unknown): record is PreviewRecord {
  return Boolean(
    record
    && typeof record === 'object'
    && 'sourceId' in record
    && typeof (record as { sourceId?: unknown }).sourceId === 'string',
  );
}

function findPreviewRecord(sourceId: string) {
  return readPreviewRecords().filter(isValidPreviewRecord).find((record) => record.sourceId === sourceId) || null;
}

async function applyApprovedRecords(sourceIds: string[], options: { skipGoogle: boolean; approvedOnly?: boolean }) {
  const args = [scriptPath, '--apply', '--json'];

  if (options.skipGoogle) {
    args.push('--skip-google');
  }

  if (options.approvedOnly) {
    args.push('--approved-only');
  } else {
    for (const sourceId of sourceIds) {
      args.push(`--source-id=${sourceId}`);
    }
  }

  const { stdout, stderr } = await execFileAsync(process.execPath, args, {
    cwd: workspaceRoot,
    maxBuffer: 1024 * 1024 * 100,
  });
  const result = JSON.parse(stdout);

  if (Array.isArray(result?.failures) && result.failures.length > 0) {
    throw new Error(result.failures.map((failure: { error?: string }) => failure.error || 'Falha desconhecida').join(' | '));
  }

  return { result, stderr: stderr || null };
}

export async function GET() {
  return NextResponse.json(readApprovals());
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = String(body?.action || '');
  const current = readApprovals();
  const currentSet = new Set(current.approvedSourceIds);
  const excludedSet = new Set(current.excludedSourceIds);

  if (action === 'approve-one') {
    const sourceId = String(body?.sourceId || '');
    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId obrigatorio.' }, { status: 400 });
    }

    const previewRecord = findPreviewRecord(sourceId);
    if (previewRecord?.invalid) {
      return NextResponse.json({ error: 'Registro invalido nao pode ser aprovado.' }, { status: 400 });
    }

    try {
      const apply = await applyApprovedRecords([sourceId], {
        skipGoogle: false,
      });
      excludedSet.delete(sourceId);
      currentSet.add(sourceId);
      return NextResponse.json({ ...writeApprovals([...currentSet].filter(Boolean), [...excludedSet].filter(Boolean)), apply });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status: 500 },
      );
    }
  }

  if (action === 'unapprove-one') {
    currentSet.delete(String(body?.sourceId || ''));
    return NextResponse.json(writeApprovals([...currentSet], [...excludedSet]));
  }

  if (action === 'exclude-one') {
    const sourceId = String(body?.sourceId || '');
    if (!sourceId) {
      return NextResponse.json({ error: 'sourceId obrigatorio.' }, { status: 400 });
    }
    currentSet.delete(sourceId);
    excludedSet.add(sourceId);
    return NextResponse.json(writeApprovals([...currentSet], [...excludedSet]));
  }

  if (action === 'restore-one') {
    const sourceId = String(body?.sourceId || '');
    excludedSet.delete(sourceId);
    return NextResponse.json(writeApprovals([...currentSet], [...excludedSet]));
  }

  if (action === 'approve-all') {
    const previewRecords = readPreviewRecords();
    const validSourceIds = previewRecords
      .filter(isValidPreviewRecord)
      .filter((record) => !record.invalid)
      .filter((record) => !excludedSet.has(record.sourceId))
      .map((record) => record.sourceId);
    const previousApprovalState = current.approvedSourceIds;
    const previousExcludedState = current.excludedSourceIds;
    const approvalState = writeApprovals(validSourceIds, [...excludedSet]);

    try {
      const apply = await applyApprovedRecords(validSourceIds, { skipGoogle: false, approvedOnly: true });
      return NextResponse.json({ ...approvalState, apply });
    } catch (error) {
      writeApprovals(previousApprovalState, previousExcludedState);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : String(error), ...readApprovals() },
        { status: 500 },
      );
    }
  }

  if (action === 'clear') {
    return NextResponse.json(writeApprovals([], []));
  }

  if (action === 'restore-all') {
    return NextResponse.json(writeApprovals([...currentSet], []));
  }

  return NextResponse.json({ error: 'Acao invalida.' }, { status: 400 });
}
