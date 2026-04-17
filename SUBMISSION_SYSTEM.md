# Spark'it Cross-Platform Submission System

Ein automatisiertes System, das es allen Nutzern ermöglicht, Ideen und Bilder zur Website beizutragen. Alle Änderungen werden über GitHub Actions verarbeitet und automatisch in die Website integriert.

## Funktionsweise

### Für Nutzer

1. **Änderungen vornehmen**: Nutzer können im Admin-Panel:
   - Neue Ideen hinzufügen
   - Bestehende Ideen bearbeiten
   - Ideen löschen
   - Bilder hochladen

2. **Änderungen einreichen**: Klick auf den Button "🔄 Änderungen einreichen"
   - Ein Badge zeigt die Anzahl der ausstehenden Änderungen an
   - Änderungen werden als JSON-Datei exportiert

3. **Automatische Integration**: GitHub Actions verarbeitet die Änderungen:
   - Neue Ideen werden in `index.html` integriert
   - Bilder werden im `uploads/` Ordner gespeichert
   - Website wird neu deployed

### Technischer Ablauf

```
Nutzer macht Änderungen → localStorage sammelt Daten
         ↓
"Änderungen einreichen" Button
         ↓
Export als JSON oder GitHub API Call
         ↓
GitHub Actions Workflow (alle 6 Stunden oder manuell)
         ↓
Node.js Script verarbeitet Daten
         ↓
Automatischer Commit & Deploy
```

## Dateien

- `index.html` - Hauptdatei mit SubmissionManager Klasse
- `.github/workflows/process-submissions.yml` - GitHub Actions Workflow
- `scripts/process-submissions.js` - Verarbeitungsscript
- `scripts/package.json` - Node.js Abhängigkeiten

## GitHub Actions Workflow

Der Workflow wird ausgelöst durch:
- Repository Dispatch Event (automatisch aus der Website)
- Manuelles Auslösen (Workflow Dispatch)
- Zeitgesteuert (alle 6 Stunden)

## Konfiguration

### GitHub Token (optional)

Für vollautomatische Submissions kann ein GitHub Personal Access Token (PAT) im localStorage gespeichert werden:

```javascript
localStorage.setItem('spark_github_token', 'ghp_xxxxxxxxxxxx');
```

**Wichtig**: Das Token benötigt `repo` Scope und sollte sicher behandelt werden.

### Ohne Token (Standard)

Ohne Token werden Änderungen als JSON-Datei exportiert. Diese Datei muss manuell ins Repository hochgeladen werden:

1. Datei im `submissions/` Ordner speichern
2. Commit & Push
3. GitHub Actions verarbeitet automatisch

## Datenformat

### Submission JSON

```json
{
  "version": 1,
  "timestamp": 1713369000000,
  "submittedAt": "2026-04-17T19:45:00Z",
  "submittedBy": "user_123456789",
  "browserInfo": "Mozilla/5.0...",
  "changes": {
    "newIdeas": [
      {
        "id": "custom-meine-idee-123456",
        "title": "Meine neue Idee",
        "description": "Beschreibung...",
        "category": "short",
        "duration": "2-3 Stunden",
        "tags": ["Eigene Idee", "Persönlich"],
        "emoji": "💡",
        "isUserAdded": true,
        "addedAt": "2026-04-17T19:45:00Z"
      }
    ],
    "editedIdeas": {
      "date-001": { "title": "Neuer Titel", "emoji": "🌟" }
    },
    "deletedIdeas": ["short-025"],
    "newImages": [
      {
        "id": "img-123456",
        "filename": "bild.jpg",
        "data": "data:image/jpeg;base64,/9j/4AAQ...",
        "uploadedAt": "2026-04-17T19:45:00Z"
      }
    ]
  }
}
```

## Limitierungen

- **Max 10 Bilder pro Submission** (zur Performance-Optimierung)
- **Max 5 MB pro Bild**
- **Bildtypen**: jpg, png, webp, gif
- **HTML-Datei**: Maximal 1000 Ideen (empfohlen)

## Fehlerbehebung

### Badge zeigt keine ausstehenden Änderungen an

- Prüfen, ob JavaScript aktiviert ist
- Browser-Console auf Fehler prüfen
- localStorage prüfen: `submissionManager.getStatus()` in Console

### GitHub Actions schlägt fehl

1. Workflow-Logs in GitHub Actions prüfen
2. Berechtigungen prüfen: `contents: write` im Workflow
3. Submission-Daten auf gültiges JSON prüfen

### Bilder werden nicht angezeigt

- Prüfen, ob Bild im `uploads/` Ordner vorhanden
- Dateigröße prüfen (< 5 MB)
- Pfad in HTML prüfen: `uploads/filename.jpg`

## Sicherheit

- Alle Texte werden escaped (XSS-Schutz)
- Bilder werden auf Dateityp und Größe geprüft
- Rate-Limiting durch GitHub Actions (max 2000 Minuten/Monat)
- Keine sensiblen Daten im JavaScript-Code

## Support

Bei Problemen:
1. Browser-Console auf Fehler prüfen
2. GitHub Actions Logs prüfen
3. Issue im Repository erstellen
