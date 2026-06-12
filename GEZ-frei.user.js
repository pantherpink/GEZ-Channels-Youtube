// ==UserScript==
// @name Youtube.com - GEZ frei!
// @namespace Violentmonkey Scripts
// @match https://www.youtube.com/*
// @grant GM_xmlhttpRequest
// @version 2.0.2
// @author -
// @description 1/20/2024, 2:38:58 PM - Updated with GitHub integration + lockup support
// @updateURL https://raw.githubusercontent.com/pantherpink/GEZ-Channels-Youtube/refs/heads/main/GEZ-frei.user.js
// @downloadURL https://raw.githubusercontent.com/pantherpink/GEZ-Channels-Youtube/refs/heads/main/GEZ-frei.user.js
// ==/UserScript==

// Konfiguration
const CONFIG = {
    GITHUB_URL: 'https://raw.githubusercontent.com/pantherpink/GEZ-Channels-Youtube/refs/heads/main/GEZ-Channels.txt',
    CACHE_KEY: 'gezChannelsList',
    CACHE_TIMESTAMP_KEY: 'gezChannelsListTimestamp',
    UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 Stunden
};

// Channel-Liste Management
class ChannelListManager {
    constructor() {
        this.channels = [];
        this.isLoaded = false;
    }

    async loadChannels() {
        try {
            const cachedChannels = this.loadFromCache();
            if (cachedChannels && cachedChannels.length > 0) {
                this.channels = cachedChannels;
                this.isLoaded = true;
                console.log('GEZ-Kanäle aus Cache geladen:', this.channels.length, 'Einträge');
                this.checkForUpdates();
                return this.channels;
            }

            console.log('Kein Cache gefunden, lade von GitHub...');
            await this.updateFromGitHub();
            return this.channels;
        } catch (error) {
            console.error('Fehler beim Laden der Kanalliste:', error);
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
            GM_xmlhttpRequest({
                method: 'GET',
                url: CONFIG.GITHUB_URL,
                onload: (response) => {
                    try {
                        if (response.status !== 200) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        const newChannels = this.parseChannelList(response.responseText);
                        if (newChannels.length === 0) {
                            throw new Error('Leere Kanalliste erhalten');
                        }

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
                onerror: () => reject(new Error('Netzwerkfehler')),
                ontimeout: () => reject(new Error('Timeout')),
                timeout: 10000
            });
        }).catch(error => {
            console.error('Fehler beim Laden von GitHub:', error);
            if (this.channels.length === 0) {
                console.error('Keine Kanalliste verfügbar');
            }
            throw error;
        });
    }

    parseChannelList(text) {
        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#'));
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

// Globale Instanz
const channelManager = new ChannelListManager();

function hideElement(element) {
    const container = element.closest('ytd-rich-item-renderer') || 
                     element.closest('yt-lockup-view-model') || 
                     element.parentNode;
    
    if (container && container.style.display !== "none") {
        container.style.display = "none";
        console.log("Versteckt:", element.innerText.trim());
    }
}

var operations = [
    // =========================
    // STARTSEITE / FEED
    // =========================
    {
        selector: 'ytd-rich-item-renderer',
        linkSelector: 'a.ytAttributedStringLink, a.yt-core-attributed-string__link, a.yt-simple-endpoint.style-scope.yt-formatted-string',
        actionFunction: function(element, avatarLink) {
            hideElement(avatarLink);
        }
    },

    // =========================
    // yt-lockup-view-model (neuestes Layout 2026)
    // =========================
    {
        selector: 'ytd-rich-item-renderer yt-lockup-view-model',
        linkSelector: 'a.ytAttributedStringLink',
        actionFunction: function(element, avatarLink) {
            hideElement(avatarLink);
        }
    },

    // =========================
    // Abschnitts-Container
    // =========================
    {
        selector: '.style-scope.ytd-item-section-renderer',
        linkSelector: 'a.yt-simple-endpoint.style-scope.yt-formatted-string, a.ytAttributedStringLink',
        actionFunction: function(element, avatarLink) {
            hideElement(avatarLink);
        }
    },

    // =========================
    // PLAYER – ENDSCREEN
    // =========================
    {
        selector: '.ytp-videowall-still',
        linkSelector: 'span.ytp-videowall-still-info-author',
        actionFunction: function(element, avatarLink) {
            hideElement(avatarLink);
        }
    },

    // =========================
    // VIDEOPAGE – SEITENLEISTE (alt + neu)
    // =========================
    {
        selector: 'ytd-compact-video-renderer, div.style-scope.ytd-compact-video-renderer',
        linkSelector: 'ytd-channel-name#channel-name yt-formatted-string#text, a.ytAttributedStringLink',
        actionFunction: function(element, avatarLink) {
            hideElement(avatarLink);
        }
    },

    // yt-lockup in Seitenleiste
    {
        selector: 'yt-lockup-view-model.ytd-item-section-renderer',
        linkSelector: 'span.yt-core-attributed-string.yt-content-metadata-view-model__metadata-text, a.ytAttributedStringLink',
        actionFunction: function(element, avatarLink) {
            hideElement(avatarLink);
        }
    }
];

function refactorElements(selector, linkSelector, actionFunction) {
    document.querySelectorAll(selector).forEach(function(element) {
        const avatarLink = element.querySelector(linkSelector);
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

    async function initialize() {
        if (isInitialized) return;
        try {
            await channelManager.loadChannels();
            console.log('GEZ-Filter initialisiert mit', channelManager.getChannels().length, 'Kanälen');
            isInitialized = true;
            hideElements();
        } catch (error) {
            console.error('Fehler bei der Initialisierung:', error);
            isInitialized = true;
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

    function debouncedHideElements() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(hideElements, 150);
    }

    const observer = new MutationObserver(() => {
        if (isInitialized) debouncedHideElements();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    initialize();

    // Regelmäßige Updates
    setInterval(() => channelManager.checkForUpdates(), 6 * 60 * 60 * 1000);

    // Debug Tools
    window.gezDebug = {
        getChannels: () => channelManager.getChannels(),
        forceUpdate: () => channelManager.updateFromGitHub(),
        clearCache: () => {
            localStorage.removeItem(CONFIG.CACHE_KEY);
            localStorage.removeItem(CONFIG.CACHE_TIMESTAMP_KEY);
            console.log('Cache gelöscht - Seite neu laden!');
        }
    };

    window.cleanupUserScript = () => observer.disconnect();
})();
