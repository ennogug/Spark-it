# GitHub Deployment Guide für Spark'it

## WICHTIG: GitHub Pages funktioniert NICHT!

Ihr Spark'it System benötigt einen Node.js Server mit Datenbank. GitHub Pages kann nur statische HTML-Dateien hosten.

## Lösung: Cloud Hosting mit Heroku (kostenlos)

### Schritt 1: Heroku einrichten

1. **Heroku Konto erstellen**: https://signup.heroku.com/
2. **Heroku CLI installieren**: https://devcenter.heroku.com/articles/heroku-cli
3. **Im Terminal anmelden**:
```bash
heroku login
```

### Schritt 2: Deployment vorbereiten

Stellen Sie sicher, dass diese Dateien in Ihrem GitHub Repository sind:
- `Procfile` (bereits erstellt)
- `package.json` (bereits vorhanden)
- `server.js` (bereits vorhanden)

### Schritt 3: Zu Heroku deployen

Im Spark'it Ordner ausführen:

```bash
# Heroku App erstellen
heroku create spark-it-vincent

# Environment Variables setzen (WICHTIG!)
heroku config:set SESSION_SECRET=vincent-birthday-secret-key-2024
heroku config:set NODE_ENV=production

# Nach Heroku deployen
git push heroku main
```

### Schritt 4: Website aufrufen

Nach erfolgreichem Deployment:
1. Heroku zeigt die URL an (z.B. https://spark-it-vincent.herokuapp.com)
2. Website aufrufen
3. Login mit: `20Vinc08:)`

## Alternative: Lokal starten

Wenn Sie nur lokal arbeiten möchten:

```bash
# Repository klonen
git clone https://github.com/IHR-BENUTZERNAME/spark-it.git
cd spark-it

# Node.js installieren (falls nicht vorhanden)
# Download von https://nodejs.org

# System einrichten
npm run setup

# Server starten
npm start

# Website aufrufen: http://localhost:3000
```

## Was passiert im Hintergrund?

### npm run setup führt aus:
1. `npm install` - Installiert alle Pakete
2. `npm run init-db` - Erstellt die Datenbank

### npm start führt aus:
1. Startet den Express Server
2. Richtet Sessions ein
3. Macht die Website verfügbar

## Fehlerbehebung

### Wenn Deployment fehlschlägt:
```bash
# Logs prüfen
heroku logs --tail

# Neu deployen
git push heroku main
```

### Wenn Login nicht funktioniert:
- Environment Variables prüfen: `heroku config`
- SESSION_SECRET muss gesetzt sein

### Wenn Bilder nicht hochgeladen werden:
- Heroku hat ein Dateisystem-Limit
- Bilder werden bei jedem Neustart gelöscht (Heroku-Einschränkung)

## Professionelle Alternative

Wenn Sie dauerhafte Bildspeicherung benötigen:
1. **AWS S3** für Bildspeicherung
2. **DigitalOcean** mit eigenem Server
3. **Render.com** (modernere Alternative zu Heroku)

## Schnellstart Zusammenfassung

1. **Heroku Konto erstellen**
2. **CLI installieren**: `heroku login`
3. **Deploy**: `heroku create && heroku config:set SESSION_SECRET=secret && git push heroku main`
4. **Aufrufen**: URL von Heroku verwenden
5. **Login**: `20Vinc08:)`

Das ist alles! Ihre Website läuft dann 24/7 im Internet.
