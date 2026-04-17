# Spark'it - Image Gallery mit Datenbank

Eine interaktive Ideen-Sammlung für Vincent Braun zum 18. Geburtstag mit persistenter Bildergalerie.

## Features

- **Ideen-Generator**: Über 110 Aktivitäts-Ideen in 3 Kategorien
- **Persistente Bildergalerie**: Benutzer können Bilder hochladen, die dauerhaft gespeichert und für alle Besucher sichtbar sind
- **Sichere Datenbank**: SQLite-Datenbank mit Bild-Metadaten und Duplikatsprüfung
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Admin-Panel**: Verwaltung aller Ideen und Aktivitäten
- **Passwortschutz**: Gesamter Bereich nur mit Passwort zugänglich
- **Session-Management**: Sichere Benutzersessions mit automatischer Abmeldung

## Installation

### Voraussetzungen

- Node.js 16+ 
- npm oder yarn

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Datenbank initialisieren

```bash
npm run init-db
```

### 3. Server starten

```bash
# Entwicklung
npm run dev

# Produktion
npm start
```

Der Server läuft standardmäßig auf Port 3000.

### 4. Zugriff auf die Website

Öffne im Browser: `http://localhost:3000`

Du wirst automatisch zur Login-Seite weitergeleitet. Gib das Passwort ein:
- **Passwort**: `20Vinc08:)`

Nach erfolgreicher Anmeldung hast du Zugriff auf alle Funktionen der Website.

## Authentifizierung

Die Website ist vollständig passwortgeschützt. Folgende Endpunkte sind verfügbar:

### Login-Endpunkte
- `GET /login` - Login-Seite
- `POST /api/login` - Login-Authentifizierung
- `POST /api/logout` - Abmeldung
- `GET /api/auth-status` - Authentifizierungsstatus prüfen

### Sicherheit
- **Passwort-Hashing**: bcrypt mit Salt-Rounds 10
- **Session-Management**: Sichere serverseitige Sessions
- **Automatische Weiterleitung**: Nicht-authentifizierte Benutzer werden zur Login-Seite geleitet
- **Session-Timeout**: 24 Stunden Inaktivität
- **HTTP-Only Cookies**: Schutz gegen XSS-Angriffe

## Projektstruktur

```
Spark'it/
|-- server.js                 # Express-Server mit API-Endpunkten
|-- package.json              # Abhängigkeiten und Skripte
|-- index.html               # Frontend-Anwendung
|-- login.html               # Login-Seite
|-- database/
|   |-- schema.sql           # Datenbank-Schema
|   |-- images.db           # SQLite-Datenbank (wird erstellt)
|-- uploads/                # Hochgeladene Bilder (wird erstellt)
|-- scripts/
|   |-- init-database.js    # Datenbank-Initialisierung
|   |-- generate-password-hash.js # Passwort-Hash Generator
|-- README.md              # Complete documentation
```

## API-Endpunkte

### Bilder hochladen
```
POST /api/upload
Content-Type: multipart/form-data
Body: FormData mit 'images' field
```

### Bilder abrufen
```
GET /api/images?page=1&limit=50
```

### Bild löschen
```
DELETE /api/images/:uploadToken
```

### Health Check
```
GET /api/health
```

## Datenbank-Schema

### Tabelle: images
- `id` - Primärschlüssel
- `filename` - Eindeutiger Dateiname
- `original_filename` - Originaler Dateiname
- `file_path` - Pfad zur gespeicherten Datei
- `file_size` - Dateigröße in Bytes
- `mime_type` - MIME-Typ
- `width/height` - Bildabmessungen
- `uploaded_at` - Upload-Zeitstempel
- `ip_address` - IP-Adresse des Uploaders
- `user_agent` - User-Agent
- `is_approved` - Genehmigungsstatus
- `upload_token` - Eindeutiger Token für Löschzugriff
- `checksum` - SHA256-Checksumme zur Duplikaterkennung

### Tabelle: image_tags
- `id` - Primärschlüssel
- `image_id` - Fremdschlüssel zu images
- `tag` - Schlagwort
- `created_at` - Erstellungszeitstempel

## Sicherheitsfunktionen

- **Dateityp-Validierung**: Nur JPEG, PNG, HEIC, WebP erlaubt
- **Dateigrößen-Begrenzung**: Maximal 10MB pro Datei
- **Duplikatsprüfung**: SHA256-Checksummen verhindern doppelte Uploads
- **Sichere Token**: Kryptografisch sichere Upload-Tokens für Löschzugriff
- **IP-Protokollierung**: Upload-IPs werden gespeichert

## Entwicklung

### Datenbank zurücksetzen
```bash
rm database/images.db
npm run init-db
```

### Uploads bereinigen
```bash
rm -rf uploads/*
```

## Lizenz

MIT License
