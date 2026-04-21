# Spark'it Datenbank-Einrichtung

## Übersicht

Spark'it verwendet nun **JSONBin.io** als kostenlose externe Datenbank für die Speicherung von Aktivitäten und Bildern. Diese Lösung ist kostenlos (bis 10.000 Requests/Monat) und API-Key geschützt.

## Warum JSONBin.io?

- **Kostenlos**: Bis 10.000 API-Requests pro Monat
- **Einfach**: Keine komplexe Server-Einrichtung nötig
- **Sicher**: API-Key Schutz
- **Schnell**: Globale CDN-Verteilung
- **JSON-basiert**: Perfekt für unsere Datenstruktur

## Einrichtung

### Schritt 1: Konto erstellen

1. Besuche [https://jsonbin.io](https://jsonbin.io)
2. Klicke auf "Sign Up" und erstelle ein kostenloses Konto
3. Bestätige deine E-Mail-Adresse

### Schritt 2: API Key erstellen

1. Melde dich bei JSONBin.io an
2. Gehe zu "Settings" (Zahnrad-Symbol oben rechts)
3. Kopiere deinen **X-Master-Key** (beginnt mit `$2a$10$...`)

### Schritt 3: Bin erstellen

1. Gehe zu "Bins" im Menü
2. Klicke auf "Create New Bin"
3. Füge folgenden Inhalt ein (oder lasse es leer - die App erstellt es automatisch):

```json
{
  "version": 1,
  "timestamp": 0,
  "sharedIdeas": [],
  "sharedImages": [],
  "customIdeas": [],
  "editedIdeas": {},
  "deletedIdeas": [],
  "history": {
    "date": [],
    "short": [],
    "fullday": []
  }
}
```

4. Speichere den Bin
5. Kopiere die **Bin ID** aus der URL (z.B. `https://api.jsonbin.io/v3/b/DEINE_BIN_ID`)

### Schritt 4: Konfiguration

1. Öffne die Datei `database-config.js` in deinem Editor
2. Ersetze die Platzhalter:

```javascript
const DB_CONFIG = {
  API_KEY: '$2a$10$DEIN_API_KEY_HIER',  // Dein X-Master-Key von JSONBin.io
  BIN_ID: 'DEINE_BIN_ID_HIER',           // Deine Bin ID
  // ... restliche Konfiguration bleibt gleich
};
```

**WICHTIG**: Bewahre deinen API-Key sicher auf und committe ihn niemals in öffentliche Repositories!

### Schritt 5: Test

1. Öffne die `index.html` in einem Browser
2. Gib das Passwort ein
3. Erstelle oder bearbeite eine Aktivität
4. Lade ein Bild hoch
5. Überprüfe in der JSONBin.io-Oberfläche, ob die Daten gespeichert wurden

## Daten-Migration

Wenn du bereits Daten im alten localStorage-Format hast, werden diese automatisch bei der ersten Nutzung in die neue Datenbank migriert.

## Fehlerbehebung

### Daten werden nicht gespeichert

- Überprüfe, ob API-Key und Bin-ID korrekt eingetragen sind
- Öffne die Browser-Entwicklerkonsole (F12) und prüfe die Konsolenausgaben
- Stelle sicher, dass dein JSONBin.io-Konto aktiv ist

### "Bin not found" Fehler

- Die Bin-ID ist möglicherweise falsch
- Erstelle einen neuen Bin und kopiere die ID erneut

### API-Limit erreicht

- Das kostenlose Kontingent beträgt 10.000 Requests/Monat
- Bei hoher Nutzung kann ein Upgrade auf den Pro-Plan ($5/Monat) nötig sein

## Sicherheitshinweise

1. **API-Key niemals öffentlich machen**: Committe `database-config.js` niemals mit echtem API-Key in ein öffentliches Repository
2. **Zugriffsbeschränkung**: JSONBin.io bietet keine Benutzer-basierte Authentifizierung - jeder mit dem API-Key hat Zugriff
3. **Backups**: Erstelle regelmäßig manuelle Backups über die JSONBin.io-Oberfläche oder die Export-Funktion in der App

## Alternative Datenbanken

Falls JSONBin.io nicht deinen Anforderungen entspricht, kannst du die `database-config.js` anpassen für:

- **Supabase** (PostgreSQL-basiert, sehr leistungsstark)
- **Firebase Firestore** (Google, real-time Sync)
- **MongoDB Atlas** (Dokumenten-Datenbank)
- **Eigener Server** mit Node.js/Express

Die Architektur der `SparkDatabase` Klasse ist modular und kann an verschiedene Backends angepasst werden.

## Support

Bei Problemen mit der Datenbank:
1. Prüfe die Browser-Konsole auf Fehlermeldungen
2. Überprüfe die Netzwerk-Requests im Entwicklertool
3. Konsultiere die [JSONBin.io Dokumentation](https://jsonbin.io/api-reference)
