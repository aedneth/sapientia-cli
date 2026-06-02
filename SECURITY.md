# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities **privately**. Do not open a public issue
for security problems.

- Email: **eduardoa.borjas@gmail.com** with subject `SECURITY: sapientia-cli`
- Or use GitHub's **private vulnerability reporting** ("Report a vulnerability"
  under the Security tab).

We aim to acknowledge reports within 72 hours and to provide a remediation
timeline after triage. Please give us a reasonable window to release a fix before
public disclosure.

## Supported versions

During the `0.x` series, only the latest minor release receives security fixes.
Once `1.0.0` ships, this section will list supported version ranges.

## Scope

In scope: the `sapientia` CLI, `@sapientia/core`, and bundled adapters. Issues
include (but aren't limited to) path traversal on download/catalog, unsafe
deserialization, SSRF via source URLs, and integrity-verification bypass.

## Copyright / takedown (DMCA) contact

Sapientia ships **no copyrighted content** and bundles adapters only for open,
public-domain, and legal archives. Shadow-library adapters are not part of this
repository (they live in a separate, opt-in package).

If you believe content reachable through a bundled source infringes your rights,
contact **eduardoa.borjas@gmail.com** with subject `DMCA: sapientia-cli`,
including the work, the source, and your contact details. Note that Sapientia is
a client that fetches from third-party archives on the user's explicit request;
takedowns generally must be directed to the hosting archive.
