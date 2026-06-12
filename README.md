# GEZ-frei 🚫📺

**YouTube ohne Rundfunkbeitrag.**

Ein Browser-Userscript, das Inhalte von GEZ-finanzierten Kanälen auf YouTube automatisch ausblendet.  
Dein Feed. Deine Regeln.

🌐 **Offizielle Website:** [gez-frei.online](https://gez-frei.online)

---

## ✨ Features

| Feature                    | Beschreibung |
|---------------------------|--------------|
| **Automatisches Ausblenden** | Videos und Empfehlungen von GEZ-Kanälen werden zuverlässig entfernt |
| **Auto-Updates**           | Die Kanalliste wird täglich automatisch aktualisiert |
| **Cloud-Kanalliste**       | Zentrale Pflege auf GitHub – immer aktuell |
| **Performance-optimiert**  | Intelligentes Caching + Debouncing für minimalen Ressourcenverbrauch |
| **Umfassende Abdeckung**   | Funktioniert auf Startseite, Suche, Seitenleiste und Endscreen |
| **Debug-Tools**            | Praktische Konsolen-Befehle zum Testen und Verwalten |

---

## 📥 Installation

1. **Userscript-Manager installieren**  
   Empfohlen: [Violentmonkey](https://violentmonkey.github.io/) oder [Tampermonkey](https://www.tampermonkey.net/)

2. **Script installieren**  
   → **[Jetzt installieren](https://raw.githubusercontent.com/pantherpink/GEZ-Channels-Youtube/refs/heads/main/GEZ-frei.user.js)**

3. **Fertig!**  
   Öffne YouTube – das Script läuft automatisch und aktualisiert sich selbst.

---

## 🔧 Debug-Befehle (Konsole)

```js
window.gezDebug.getChannels()   // Zeigt alle geladenen Kanäle
window.gezDebug.forceUpdate()   // Sofortige Aktualisierung der Liste
window.gezDebug.clearCache()    // Cache löschen und neu laden
