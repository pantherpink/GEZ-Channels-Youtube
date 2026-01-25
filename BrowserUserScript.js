// ==UserScript==
// @name        Youtube.com - GEZ frei!
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/*
// @grant       GM_xmlhttpRequest
// @version     2.0
// @author      -
// @description 1/20/2024, 2:38:58 PM - Updated with GitHub integration
// ==/UserScript==

// Konfiguration
const CONFIG = {
    GITHUB_URL: 'https://raw.githubusercontent.com/pantherpink/GEZ-Channels-Youtube/refs/heads/main/GEZ-Channels.txt',
    CACHE_KEY: 'gezChannelsList',
    CACHE_TIMESTAMP_KEY: 'gezChannelsListTimestamp',
    UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 Stunden in Millisekunden
};

// Channel-Liste Management
class ChannelListManager {
    constructor() {
        this.channels = [];
        this.isLoaded = false;
    }

    async loadChannels() {
        try {
            // Versuche zuerst aus dem Cache zu laden
            const cachedChannels = this.loadFromCache();
            if (cachedChannels && cachedChannels.length > 0) {
                this.channels = cachedChannels;
                this.isLoaded = true;
                console.log('GEZ-Kanäle aus Cache geladen:', this.channels.length, 'Einträge');

                // Prüfe ob Update nötig ist (asynchron)
                this.checkForUpdates();
                return this.channels;
            }

            // Falls kein Cache vorhanden, lade von GitHub
            console.log('Kein Cache gefunden, lade von GitHub...');
            await this.updateFromGitHub();
            return this.channels;

        } catch (error) {
            console.error('Fehler beim Laden der Kanalliste:', error);
            // Keine Fallback-Liste - Script wartet auf erfolgreichen GitHub-Zugriff
            throw error;
        }
    }

    loadFromCache() {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            const timestamp = localStorage.getItem(CONFIG.CACHE_TIMESTAMP_KEY);

            if (!cached || !timestamp) return null;

            const cacheAge = Date.now() - parseInt(timestamp);
            if (cacheAge > CONFIG.UPDATE_INTERVAL) {
                console.log('Cache ist veraltet, wird aktualisiert...');
                return null;
            }

            return JSON.parse(cached);
        } catch (error) {
            console.error('Fehler beim Lesen des Caches:', error);
            return null;
        }
    }

    async checkForUpdates() {
        const timestamp = localStorage.getItem(CONFIG.CACHE_TIMESTAMP_KEY);
        if (!timestamp) return;

        const cacheAge = Date.now() - parseInt(timestamp);
        if (cacheAge > CONFIG.UPDATE_INTERVAL) {
            console.log('Cache-Update erforderlich...');
            await this.updateFromGitHub();
        }
    }

    async updateFromGitHub() {
        return new Promise((resolve, reject) => {
            console.log('Lade Kanalliste von GitHub...');

            // GM_xmlhttpRequest umgeht CORS-Probleme
            GM_xmlhttpRequest({
                method: 'GET',
                url: CONFIG.GITHUB_URL,
                onload: (response) => {
                    try {
                        if (response.status !== 200) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const newChannels = this.parseChannelList(response.responseText);

                        if (newChannels.length === 0) {
                            throw new Error('Leere Kanalliste erhalten');
                        }

                        // Speichere im Cache
                        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(newChannels));
                        localStorage.setItem(CONFIG.CACHE_TIMESTAMP_KEY, Date.now().toString());

                        this.channels = newChannels;
                        this.isLoaded = true;

                        console.log('Kanalliste erfolgreich aktualisiert:', newChannels.length, 'Einträge');
                        resolve(newChannels);

                    } catch (error) {
                        reject(error);
                    }
                },
                onerror: (error) => {
                    reject(new Error('Netzwerkfehler beim Laden von GitHub: ' + error));
                },
                ontimeout: () => {
                    reject(new Error('Timeout beim Laden von GitHub'));
                },
                timeout: 10000 // 10 Sekunden Timeout
            });
        }).catch(error => {
            console.error('Fehler beim Laden von GitHub:', error);

            // Wenn bereits eine gecachte Version vorhanden ist, diese weiter verwenden
            if (this.channels.length === 0) {
                console.error('Keine Kanalliste verfügbar - Script funktioniert erst nach erfolgreichem GitHub-Zugriff');
            }

            throw error;
        });
    }

    parseChannelList(text) {
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#')); // Erlaube Kommentare mit #
    }

    getChannels() {
        return this.channels;
    }

    isChannelHidden(channelName) {
        if (!this.isLoaded) return false;

        const cleanName = channelName.split("•")[0].trim();
        return this.channels.some(name => cleanName === name);
    }
}

// Globale Instanz des Channel Managers
const channelManager = new ChannelListManager();

function replaceElement(element, avatarLink) {
    var div = document.createElement('div');
    element.parentNode.remove();
    console.log("Found a channel video", avatarLink.innerText);
}

function hideElement(element, avatarLink) {
    if (element.parentNode.style.display != "none") {
        element.parentNode.style.display = "none";
        console.log("Versteckt:", avatarLink.innerText);
    }
}

var operations = [

    // =========================
    // STARTSEITE / FEED (alte Layouts)
    // =========================

    // Klassische Video-Kacheln auf Startseite / Abo-Feed (yt-formatted-string)
    {
        selector: '.style-scope.ytd-rich-item-renderer',
        linkSelector: 'a.yt-simple-endpoint.style-scope.yt-formatted-string',
        actionFunction: function(element, avatarLink) {
            hideElement(element, avatarLink);
        }
    },

    // Abschnitts-Container (Sections) auf Startseite / gemischte Blöcke
    {
        selector: '.style-scope.ytd-item-section-renderer',
        linkSelector: 'a.yt-simple-endpoint.style-scope.yt-formatted-string',
        actionFunction: function(element, avatarLink) {
            hideElement(element, avatarLink);
        }
    },

    // Vertikale Listen (Suche, Kanäle, Playlists, ältere Layouts)
    {
        selector: '.style-scope.ytd-vertical-list-renderer',
        linkSelector: 'a.yt-simple-endpoint.style-scope.yt-formatted-string',
        actionFunction: function(element, avatarLink) {
            hideElement(element, avatarLink);
        }
    },


    // =========================
    // PLAYER – ENDSCREEN (IM VIDEO)
    // =========================

    // Endscreen-Vorschläge im Player – kleine Karten
    {
        selector: '.ytp-videowall-still.ytp-suggestion-set.ytp-videowall-still-round-medium',
        linkSelector: 'span.ytp-videowall-still-info-author',
        actionFunction: function(element, avatarLink) {
            hideElement(element, avatarLink);
        }
    },

    // Endscreen-Vorschläge im Player – große Karten
    {
        selector: 'a.ytp-videowall-still.ytp-videowall-still-round-large.ytp-suggestion-set',
        linkSelector: 'span.ytp-videowall-still-info-author',
        actionFunction: function(element, avatarLink) {
            hideElement(element, avatarLink);
        }
    },


    // =========================
    // VIDEOPAGE – SEITENLEISTE (alt)
    // =========================

    // Rechte Seitenleiste neben Video – kompakte Vorschläge (ytd-compact-video-renderer)
    {
        selector: 'div.style-scope.ytd-compact-video-renderer',
        linkSelector: 'ytd-channel-name#channel-name yt-formatted-string#text',
        actionFunction: function(element, avatarLink) {
            hideElement(element, avatarLink);
        }
    },


    // =========================
    // STARTSEITE / FEED (neues Layout)
    // =========================

    // Klassische Video-Kacheln – neues Layout mit yt-core-attributed-string
    {
        selector: '.style-scope.ytd-rich-item-renderer',
        linkSelector: 'a.yt-core-attributed-string__link',
        actionFunction: function(element, avatarLink) {
            hideElement(element, avatarLink);
        }
    },


    // =========================
    // VIDEOPAGE – SEITENLEISTE (neues Lockup View Model)
    // =========================

    // Rechte Seitenleiste auf Video-Seite – neues yt-lockup-view-model
    {
        selector: 'yt-lockup-view-model.ytd-item-section-renderer.lockup.yt-lockup-view-model--wrapper, .ytd-item-section-renderer.lockup.yt-lockup-view-model--wrapper',
        linkSelector: 'span.yt-core-attributed-string.yt-content-metadata-view-model__metadata-text',
        actionFunction: function(element, avatarLink) {
            element.style.display = "none";
        }
    }

];


function refactorElements(selector, linkSelector, actionFunction) {
    var elementsToCheck = document.querySelectorAll(selector);

    elementsToCheck.forEach(function(element) {
        var avatarLink = element.querySelector(linkSelector);
        if (avatarLink && channelManager.isChannelHidden(avatarLink.innerText)) {
            actionFunction(element, avatarLink);
        }
    });
}

(function() {
    'use strict';

    let debounceTimer = null;
    let isRunning = false;
    let isInitialized = false;

    // Initialisierung der Kanalliste
    async function initialize() {
        if (isInitialized) return;

        try {
            await channelManager.loadChannels();
            console.log('GEZ-Filter initialisiert mit', channelManager.getChannels().length, 'Kanälen');
            isInitialized = true;

            // Erste Ausführung nach dem Laden der Liste
            hideElements();

        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
            isInitialized = true; // Trotzdem als initialisiert markieren, um Endlosschleifen zu vermeiden
        }
    }

    function hideElements() {
        if (!isInitialized || isRunning) return;
        isRunning = true;

        try {
            operations.forEach(function(op) {
                refactorElements(op.selector, op.linkSelector, op.actionFunction);
            });
        } finally {
            isRunning = false;
        }
    }

    // OPTION 1: Debouncing (wartet bis Ruhe einkehrt)
    function debouncedHideElements() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(hideElements, 150); // 150ms Verzögerung
    }

    // OPTION 2: Throttling (maximal alle X ms)
    let lastExecution = 0;
    function throttledHideElements() {
        const now = Date.now();
        if (now - lastExecution >= 200) { // Maximal alle 200ms
            lastExecution = now;
            hideElements();
        }
    }

    // OPTION 3: RequestAnimationFrame (sync mit Browser-Rendering)
    let rafId = null;
    function rafHideElements() {
        if (rafId) return; // Bereits geplant
        rafId = requestAnimationFrame(() => {
            hideElements();
            rafId = null;
        });
    }

    // MutationObserver mit gewählter Optimierung
    const observer = new MutationObserver(function(mutations) {
        // Nur bei relevanten Änderungen reagieren
        let shouldUpdate = false;
        for (let mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Prüfe ob hinzugefügte Nodes relevant sind
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        shouldUpdate = true;
                        break;
                    }
                }
            }
            if (shouldUpdate) break;
        }

        if (shouldUpdate && isInitialized) {
            // Wähle eine der drei Optionen:
            debouncedHideElements();  // Empfohlen für die meisten Fälle
            // throttledHideElements(); // Alternative
            // rafHideElements();       // Für sehr häufige Updates
        }
    });

    // Start observin' the whole body for changes in child elements.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initialisierung starten
    initialize();

    // Regelmäßige Updates prüfen (alle 6 Stunden)
    setInterval(() => {
        channelManager.checkForUpdates();
    }, 6 * 60 * 60 * 1000);

    // Optional: Cleanup bei Bedarf
    window.cleanupUserScript = function() {
        observer.disconnect();
        clearTimeout(debounceTimer);
        if (rafId) cancelAnimationFrame(rafId);
    };

    // Debug-Funktion für die Konsole
    window.gezDebug = {
        getChannels: () => channelManager.getChannels(),
        forceUpdate: () => channelManager.updateFromGitHub(),
        clearCache: () => {
            localStorage.removeItem(CONFIG.CACHE_KEY);
            localStorage.removeItem(CONFIG.CACHE_TIMESTAMP_KEY);
            console.log('Cache gelöscht');
        }
    };

})();
