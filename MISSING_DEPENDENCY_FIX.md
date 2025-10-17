# Missing Dependency Fix - pdf-parse

## Problem
Railway Build fehlgeschlagen mit:
```
Module not found: Can't resolve 'pdf-parse'
```

## Ursache
Bei der Umstellung von `pdfjs-dist` auf `pdf-parse` wurde vergessen, das Package als Dependency hinzuzufügen.

## Lösung
1. `pdf-parse` (^1.1.1) zu dependencies hinzugefügt
2. `@types/pdf-parse` (^1.1.4) zu devDependencies hinzugefügt

## Commits
- d69c693: Fix: Füge pdf-parse dependency hinzu für Production Build

## Deployment
Änderungen am 17.10.2025 deployed - Railway sollte automatisch rebuilden.

