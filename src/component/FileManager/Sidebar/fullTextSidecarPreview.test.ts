import assert from "node:assert/strict";
import { test } from "node:test";
import type { FullTextSidecarObject } from "../../../api/explorer.ts";
import {
  buildSidecarObjectVirtualFile,
  buildSidecarPreviewVirtualFile,
  selectSidecarPreviewTarget,
} from "./fullTextSidecarPreview.ts";

const sidecarObject = (overrides: Partial<FullTextSidecarObject> = {}): FullTextSidecarObject => ({
  id: "attachments/archive.pdf",
  kind: "embedded",
  name: "archive.pdf",
  uri: "cloudreve://sidecar/attachments/archive.pdf",
  path: "cloudreve/fts-sidecar/1/1/1/attachments/archive.pdf",
  mime_type: "application/pdf",
  size: 1024,
  url: "http://localhost:5212/api/v4/file/fulltext/sidecar/object/original",
  ...overrides,
});

test("sidecar preview uses extracted text target when an attachment has preview artifact", () => {
  const item = sidecarObject({
    preview_uri: "cloudreve://sidecar/attachment-text/attachments/archive.pdf.txt",
    preview_url: "http://localhost:5212/api/v4/file/fulltext/sidecar/object/preview",
  });

  const target = selectSidecarPreviewTarget(item);

  assert.equal(target.uri, item.preview_uri);
  assert.equal(target.url, item.preview_url);
  assert.equal(target.fileName, "archive.pdf.txt");
  assert.equal(target.viewerFileName, "archive.pdf.txt");
  assert.equal(target.size, 0);
});

test("sidecar preview keeps original target when no preview artifact exists", () => {
  const item = sidecarObject({ name: "note.txt", uri: "cloudreve://sidecar/content.txt", size: 12 });

  const target = selectSidecarPreviewTarget(item);

  assert.equal(target.uri, item.uri);
  assert.equal(target.url, item.url);
  assert.equal(target.fileName, "note.txt");
  assert.equal(target.viewerFileName, "note.txt");
  assert.equal(target.size, 12);
});

test("sidecar virtual file is built from selected preview target", () => {
  const item = sidecarObject({
    preview_uri: "cloudreve://sidecar/attachment-text/attachments/archive.pdf.txt",
    preview_url: "http://localhost:5212/api/v4/file/fulltext/sidecar/object/preview",
  });
  const target = selectSidecarPreviewTarget(item);

  const virtualFile = buildSidecarPreviewVirtualFile("2026-06-03T10:00:00Z", target);

  assert.equal(virtualFile?.path, item.preview_uri);
  assert.equal(virtualFile?.name, "archive.pdf.txt");
  assert.equal(virtualFile?.size, 0);
});

test("sidecar preview file name decodes encoded preview uri basename", () => {
  const item = sidecarObject({
    preview_uri: "cloudreve://sidecar/attachment-text/attachments/%E5%85%AC%E5%85%B1.txt.txt",
    preview_url: "http://localhost:5212/api/v4/file/fulltext/sidecar/object/preview",
  });

  const target = selectSidecarPreviewTarget(item);

  assert.equal(target.fileName, "公共.txt.txt");
  assert.equal(target.viewerFileName, "公共.txt.txt");
});

test("sidecar object virtual file keeps original attachment for download", () => {
  const item = sidecarObject({
    preview_uri: "cloudreve://sidecar/attachment-text/attachments/archive.pdf.txt",
    preview_url: "http://localhost:5212/api/v4/file/fulltext/sidecar/object/preview",
  });

  const virtualFile = buildSidecarObjectVirtualFile("2026-06-03T10:00:00Z", item);

  assert.equal(virtualFile?.path, item.uri);
  assert.equal(virtualFile?.name, "archive.pdf");
  assert.equal(virtualFile?.size, 1024);
});
