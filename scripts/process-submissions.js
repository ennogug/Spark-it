#!/usr/bin/env node

/**
 * Process User Submissions for Spark'it
 * 
 * Dieses Script verarbeitet Nutzer-Submissions und integriert sie in die index.html.
 * Es wird von GitHub Actions aufgerufen.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Konfiguration
const CONFIG = {
  htmlFile: path.join(__dirname, '..', 'index.html'),
  uploadsDir: path.join(__dirname, '..', 'uploads'),
  maxImages: 10,
  backupHtml: true
};

/**
 * Liest Submission-Daten aus Umgebungsvariablen oder Dateien
 */
function readSubmissions() {
  const submissions = [];
  
  // 1. Repository Dispatch Event Daten
  if (process.env.SUBMISSION_DATA) {
    try {
      const data = JSON.parse(process.env.SUBMISSION_DATA);
      submissions.push(data);
      console.log('📥 Repository Dispatch Submission empfangen');
    } catch (error) {
      console.error('❌ Fehler beim Parsen der Repository Dispatch Daten:', error.message);
    }
  }
  
  // 2. Manuelle Eingabe
  if (process.env.MANUAL_DATA) {
    try {
      const data = JSON.parse(process.env.MANUAL_DATA);
      submissions.push(data);
      console.log('📥 Manuelle Submission empfangen');
    } catch (error) {
      console.error('❌ Fehler beim Parsen der manuellen Daten:', error.message);
    }
  }
  
  // 3. Lese aus submissions/ Ordner (falls vorhanden)
  const submissionsDir = path.join(__dirname, '..', 'submissions');
  if (fs.existsSync(submissionsDir)) {
    const files = fs.readdirSync(submissionsDir)
      .filter(f => f.endsWith('.json'))
      .sort(); // Älteste zuerst
    
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(submissionsDir, file), 'utf8'));
        submissions.push(data);
        console.log(`📥 Submission aus Datei ${file} geladen`);
      } catch (error) {
        console.error(`❌ Fehler beim Lesen von ${file}:`, error.message);
      }
    }
  }
  
  return submissions;
}

/**
 * Extrahiert das originalIdeas Array aus der HTML-Datei
 */
function extractOriginalIdeas(html) {
  // Suche nach dem originalIdeas Array
  const regex = /const originalIdeas = \[([\s\S]*?)\];/;
  const match = html.match(regex);
  
  if (!match) {
    console.error('❌ Konnte originalIdeas Array nicht finden');
    return null;
  }
  
  // Parse die makeIdea Aufrufe
  const ideas = [];
  const ideaRegex = /makeIdea\("([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", "([^"]+)", \[([^\]]*)\], "([^"]*)"(?:, (true|false))?\)/g;
  
  let ideaMatch;
  while ((ideaMatch = ideaRegex.exec(match[1])) !== null) {
    const tags = ideaMatch[6].split(',').map(t => t.trim().replace(/"/g, '')).filter(Boolean);
    
    ideas.push({
      id: ideaMatch[1],
      title: ideaMatch[2],
      description: ideaMatch[3],
      category: ideaMatch[4],
      duration: ideaMatch[5],
      tags: tags,
      emoji: ideaMatch[7],
      isUserAdded: ideaMatch[8] === 'true'
    });
  }
  
  return ideas;
}

/**
 * Konvertiert Idee zu makeIdea String
 */
function ideaToMakeIdeaString(idea) {
  const tagsStr = idea.tags.map(t => `"${t}"`).join(', ');
  const userAddedStr = idea.isUserAdded ? ', true' : '';
  
  // Escaping für Beschreibung
  const escapedDesc = idea.description.replace(/"/g, '\\"');
  const escapedTitle = idea.title.replace(/"/g, '\\"');
  
  return `makeIdea("${idea.id}", "${escapedTitle}", "${escapedDesc}", "${idea.category}", "${idea.duration}", [${tagsStr}], "${idea.emoji}"${userAddedStr})`;
}

/**
 * Integriert neue Ideen in das originalIdeas Array
 */
function integrateIdeas(html, newIdeas, editedIdeas, deletedIdeas) {
  // Extrahiere aktuelle Ideen
  const currentIdeas = extractOriginalIdeas(html);
  if (!currentIdeas) {
    return html;
  }
  
  console.log(`📊 Aktuell ${currentIdeas.length} Ideen in der Datenbank`);
  
  // Erstelle Map für schnellen Zugriff
  const ideaMap = new Map(currentIdeas.map(i => [i.id, i]));
  
  // Füge neue Ideen hinzu
  let addedCount = 0;
  for (const newIdea of newIdeas) {
    if (!ideaMap.has(newIdea.id)) {
      // Generiere ID falls nicht vorhanden
      if (!newIdea.id) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        newIdea.id = `custom-${newIdea.title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)}-${timestamp}`;
      }
      
      // Setze Emoji falls nicht vorhanden
      if (!newIdea.emoji) {
        newIdea.emoji = '💡';
      }
      
      // Setze Tags
      if (!newIdea.tags || newIdea.tags.length === 0) {
        newIdea.tags = ['Eigene Idee', 'Persönlich'];
      }
      
      // Markiere als Nutzer-Idee
      newIdea.isUserAdded = true;
      
      ideaMap.set(newIdea.id, newIdea);
      addedCount++;
      console.log(`➕ Neue Idee hinzugefügt: ${newIdea.title}`);
    }
  }
  
  // Bearbeite existierende Ideen
  let editedCount = 0;
  for (const [id, changes] of Object.entries(editedIdeas)) {
    if (ideaMap.has(id)) {
      const idea = ideaMap.get(id);
      Object.assign(idea, changes);
      editedCount++;
      console.log(`✏️ Idee bearbeitet: ${idea.title}`);
    }
  }
  
  // Lösche Ideen
  let deletedCount = 0;
  for (const id of deletedIdeas) {
    if (ideaMap.has(id)) {
      const idea = ideaMap.get(id);
      ideaMap.delete(id);
      deletedCount++;
      console.log(`🗑️ Idee gelöscht: ${idea.title}`);
    }
  }
  
  console.log(`\n📈 Statistik:`);
  console.log(`   - ${addedCount} neue Ideen hinzugefügt`);
  console.log(`   - ${editedCount} Ideen bearbeitet`);
  console.log(`   - ${deletedCount} Ideen gelöscht`);
  console.log(`   - ${ideaMap.size} Ideen insgesamt\n`);
  
  // Konvertiere Map zurück zu Array
  const allIdeas = Array.from(ideaMap.values());
  
  // Sortiere: Original-Ideen zuerst, dann eigene
  const sortedIdeas = allIdeas.sort((a, b) => {
    if (a.isUserAdded && !b.isUserAdded) return 1;
    if (!a.isUserAdded && b.isUserAdded) return -1;
    return 0;
  });
  
  // Erstelle neuen Array-String
  const ideasStrings = sortedIdeas.map(idea => '      ' + ideaToMakeIdeaString(idea));
  
  // Teile in Original und Custom
  const originalIdeas = ideasStrings.filter(s => !s.includes(', true)'));
  const customIdeas = ideasStrings.filter(s => s.includes(', true)'));
  
  let newArrayContent = '';
  
  if (originalIdeas.length > 0) {
    newArrayContent += originalIdeas.join(',\n');
  }
  
  if (customIdeas.length > 0) {
    if (newArrayContent) newArrayContent += ',\n\n';
    newArrayContent += '      // User\'s custom ideas\n';
    newArrayContent += customIdeas.join(',\n');
  }
  
  // Ersetze das Array in HTML
  const oldArrayRegex = /const originalIdeas = \[[\s\S]*?\];/;
  const newArray = `const originalIdeas = [\n${newArrayContent}\n    ];`;
  
  return html.replace(oldArrayRegex, newArray);
}

/**
 * Verarbeitet hochgeladene Bilder
 */
async function processImages(newImages) {
  if (!newImages || newImages.length === 0) {
    return [];
  }
  
  // Erstelle uploads Ordner falls nicht vorhanden
  if (!fs.existsSync(CONFIG.uploadsDir)) {
    fs.mkdirSync(CONFIG.uploadsDir, { recursive: true });
    console.log(`📁 Uploads-Ordner erstellt: ${CONFIG.uploadsDir}`);
  }
  
  const processedImages = [];
  
  for (const img of newImages.slice(0, CONFIG.maxImages)) {
    try {
      // Bestimme Dateiendung
      let ext = 'png';
      if (img.data && img.data.includes('image/jpeg')) ext = 'jpg';
      else if (img.data && img.data.includes('image/webp')) ext = 'webp';
      else if (img.data && img.data.includes('image/gif')) ext = 'gif';
      
      // Erstelle Dateiname
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 6);
      const filename = `upload-${timestamp}-${random}.${ext}`;
      const filepath = path.join(CONFIG.uploadsDir, filename);
      
      // Extrahiere Base64-Daten
      const base64Data = img.data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Speichere Bild
      fs.writeFileSync(filepath, buffer);
      
      processedImages.push({
        id: img.id || `img-${timestamp}`,
        filename: filename,
        originalName: img.filename || filename,
        uploadedAt: img.uploadedAt || new Date().toISOString(),
        path: `uploads/${filename}`
      });
      
      console.log(`🖼️ Bild gespeichert: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`❌ Fehler beim Verarbeiten des Bildes:`, error.message);
    }
  }
  
  return processedImages;
}

/**
 * Aktualisiert die Galerie in der HTML-Datei
 */
function updateGallery(html, newImages) {
  if (newImages.length === 0) {
    return html;
  }
  
  // Lade HTML mit cheerio
  const $ = cheerio.load(html);
  
  // Finde die Galerie
  const galleryGrid = $('.gallery-grid');
  if (galleryGrid.length === 0) {
    console.log('⚠️ Galerie nicht gefunden, überspringe Bild-Aktualisierung');
    return html;
  }
  
  // Füge neue Bilder hinzu
  for (const img of newImages) {
    const galleryItem = $(`
      <div class="gallery-item">
        <img src="${img.path}" alt="${img.originalName}" loading="lazy">
        <div class="gallery-overlay">
          <span>Hochgeladen am ${new Date(img.uploadedAt).toLocaleDateString('de-DE')}</span>
        </div>
      </div>
    `);
    galleryGrid.append(galleryItem);
  }
  
  console.log(`🖼️ ${newImages.length} Bilder zur Galerie hinzugefügt`);
  
  return $.html();
}

/**
 * Erstellt Backup der HTML-Datei
 */
function createBackup(html) {
  if (!CONFIG.backupHtml) return;
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${CONFIG.htmlFile}.backup-${timestamp}`;
  
  fs.writeFileSync(backupPath, html, 'utf8');
  console.log(`💾 Backup erstellt: ${backupPath}`);
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('🚀 Spark\'it Submission Processor\n');
  console.log('=' .repeat(50));
  
  // Lese Submissions
  const submissions = readSubmissions();
  
  if (submissions.length === 0) {
    console.log('\nℹ️ Keine Submissions zum Verarbeiten');
    process.exit(0);
  }
  
  console.log(`\n📦 ${submissions.length} Submission(s) gefunden\n`);
  
  // Lese aktuelle HTML-Datei
  let html = fs.readFileSync(CONFIG.htmlFile, 'utf8');
  
  // Erstelle Backup
  createBackup(html);
  
  // Verarbeite jede Submission
  let totalNewIdeas = [];
  let totalEditedIdeas = {};
  let totalDeletedIdeas = [];
  let totalNewImages = [];
  
  for (const submission of submissions) {
    console.log(`\n📝 Verarbeite Submission vom ${new Date(submission.timestamp).toLocaleString('de-DE')}`);
    console.log(`   von: ${submission.submittedBy || 'Unbekannt'}`);
    
    if (submission.changes) {
      if (submission.changes.newIdeas) {
        totalNewIdeas.push(...submission.changes.newIdeas);
      }
      if (submission.changes.editedIdeas) {
        Object.assign(totalEditedIdeas, submission.changes.editedIdeas);
      }
      if (submission.changes.deletedIdeas) {
        totalDeletedIdeas.push(...submission.changes.deletedIdeas);
      }
      if (submission.changes.newImages) {
        totalNewImages.push(...submission.changes.newImages);
      }
    }
  }
  
  // Entferne Duplikate
  totalNewIdeas = totalNewIdeas.filter((idea, index, self) => 
    index === self.findIndex(i => i.id === idea.id)
  );
  totalDeletedIdeas = [...new Set(totalDeletedIdeas)];
  
  console.log('\n📊 Zusammenfassung:');
  console.log(`   - ${totalNewIdeas.length} neue Ideen`);
  console.log(`   - ${Object.keys(totalEditedIdeas).length} bearbeitete Ideen`);
  console.log(`   - ${totalDeletedIdeas.length} gelöschte Ideen`);
  console.log(`   - ${totalNewImages.length} neue Bilder`);
  
  // Integriere Ideen
  if (totalNewIdeas.length > 0 || Object.keys(totalEditedIdeas).length > 0 || totalDeletedIdeas.length > 0) {
    html = integrateIdeas(html, totalNewIdeas, totalEditedIdeas, totalDeletedIdeas);
  }
  
  // Verarbeite Bilder
  const processedImages = await processImages(totalNewImages);
  
  // Aktualisiere Galerie
  if (processedImages.length > 0) {
    html = updateGallery(html, processedImages);
  }
  
  // Speichere aktualisierte HTML
  fs.writeFileSync(CONFIG.htmlFile, html, 'utf8');
  console.log(`\n✅ HTML-Datei aktualisiert: ${CONFIG.htmlFile}`);
  
  // Lösche verarbeitete Submissions
  const submissionsDir = path.join(__dirname, '..', 'submissions');
  if (fs.existsSync(submissionsDir)) {
    const files = fs.readdirSync(submissionsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      fs.unlinkSync(path.join(submissionsDir, file));
      console.log(`🗑️ Submission-Datei gelöscht: ${file}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Verarbeitung abgeschlossen!');
}

// Führe Hauptfunktion aus
main().catch(error => {
  console.error('\n❌ Kritischer Fehler:', error);
  process.exit(1);
});
