# 🚀 Spark'it - Quick Start Guide

## ⚡ Sofort Start (ohne zusätzliche Konfiguration)

### 1. Repository klonen
```bash
git clone <IHR-GITHUB-REPOSITORY>
cd spark-it
```

### 2. System starten
```bash
npm run setup
npm start
```

### 3. Website aufrufen
- URL: http://localhost:3000
- Passwort: `20Vinc08:)`

---

## ✅ Was automatisch funktioniert:

### 🔐 **Authentifizierung**
- Login-Seite wird automatisch angezeigt
- Passwort: `20Vinc08:)`
- Session-Management (24h gültig)
- Logout-Funktion

### 📸 **Bildergalerie**
- Bilder hochladen (JPEG, PNG, HEIC, WebP)
- Dauerspeicherung in Datenbank
- Galerie-Ansicht für alle Nutzer
- Bilder löschen mit X-Button

### 💡 **Ideen-Generator**
- 110+ Aktivitäts-Ideen
- 3 Kategorien verfügbar
- Admin-Panel (Archive Button)

### 🎨 **Design & UX**
- Responsive Design (Mobile/Tablet/Desktop)
- Spark'it Branding
- Smooth Animations
- User-Friendly Interface

---

## 📁 Benötigte Dateien (alle vorhanden):

```
✅ server.js              - Express Server mit Authentifizierung
✅ package.json           - Abhängigkeiten & Skripte  
✅ index.html            - Hauptanwendung
✅ login.html            - Login-Portal
✅ database/schema.sql    - Datenbank-Struktur
✅ Procfile              - Heroku Deployment
✅ .gitignore            - Git Ignore Regeln
✅ .env.example          - Environment Vorlage
```

---

## 🌐 Deployment Optionen:

### **Lokal (empfohlen für Entwicklung)**
```bash
npm run setup && npm start
```

### **Heroku (für 24/7 Online-Zugriff)**
```bash
heroku create spark-it-app
heroku config:set SESSION_SECRET=secret-key-2024
git push heroku main
```

### **GitHub Repository**
1. Alle Dateien sind bereit für GitHub
2. Keine zusätzlichen Konfigurationen nötig
3. Funktioniert sofort nach Klonen

---

## 🔧 Technologie-Stack:

- **Backend**: Node.js + Express.js
- **Datenbank**: SQLite (automatisch erstellt)
- **Authentifizierung**: bcrypt + Sessions
- **File Upload**: Multer + Sharp
- **Frontend**: Vanilla JavaScript + CSS

---

## 🚨 Wichtige Hinweise:

1. **Keine manuelle Konfiguration nötig**
2. **Datenbank wird automatisch erstellt**
3. **Uploads-Ordner wird automatisch erstellt**
4. **Passwort ist fest: `20Vinc08:)`
5. **Alles ist production-ready**

---

## 📞 Support bei Problemen:

### **Fehler: "node not found"**
```bash
# Node.js installieren von https://nodejs.org
```

### **Fehler: "Port 3000 belegt"**
```bash
PORT=3001 npm start
```

### **Fehler: "Datenbank Probleme"**
```bash
rm database/images.db
npm start  # Erstellt neue DB automatisch
```

---

## 🎯 Das ist alles!

Die Website funktioniert **sofort** nach dem Klonen und Ausführen von `npm run setup && npm start`. 
Keine zusätzlichen Schritte erforderlich!
