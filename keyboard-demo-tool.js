/**
 * Keyboard Demo Tool
 * Copyright (c) 2026 Linda Nakasone
 * Licensed under MIT License
 * https://github.com/linda-n-design/bookmarklet-keyboard-demo
 */

(function() {
    'use strict';
    
    // Version
    const VERSION = 'Beta 0.12.0';
    
    // Prevent multiple instances
    if (window.keyboardVisualizerActive) {
        console.log('Keyboard Demo Tool already active');
        return;
    }
    window.keyboardVisualizerActive = true;
    
    // Detect operating system from User Agent
    const ua = navigator.userAgent;
    const platform = navigator.platform || '';
    
    // OS Detection for shortcuts (based on user's actual OS)
    const isMacOS = /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac|iPhone|iPad|iPod/i.test(ua);
    const isWindows = /Win/i.test(platform) || /Windows/i.test(ua);
    const isLinux = /Linux/i.test(platform) && !/Android/i.test(ua);
    const isChromeOS = /CrOS/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    const isiOS = /iPhone|iPad|iPod/i.test(ua);
    
    // Determine OS name for shortcuts display
    let osName = 'Windows'; // Default fallback
    if (isMacOS) osName = 'Mac';
    else if (isWindows) osName = 'Windows';
    else if (isLinux) osName = 'Linux';
    else if (isChromeOS) osName = 'Chrome OS';
    else if (isAndroid) osName = 'Android';
    
    // Determine default keyboard layout (Mac layout for Apple devices, Windows for others)
    const defaultKeyboardLayout = isMacOS ? 'mac' : 'windows';
    
    // Load theme preference from localStorage
    let savedTheme = 'light';
    let savedKeyboardLayout = defaultKeyboardLayout;
    try {
        savedTheme = localStorage.getItem('keyboardDemoTool_theme') || 'light';
        savedKeyboardLayout = localStorage.getItem('keyboardDemoTool_keyboardLayout') || defaultKeyboardLayout;
    } catch (e) {
        console.log('Keyboard Demo Tool: Could not load preferences');
    }
    
    // Track pressed keys
    const pressedKeys = new Set();
    
    // Create OS-specific shortcut labels (based on user's actual OS, not changeable)
    const closeShortcutSimple = isMacOS ? 'option+\\' : 'Alt+\\';
    const themeShortcutSimple = isMacOS ? 'option+T' : 'Alt+T';
    
    // Helper function to create keyboard key HTML for dialog
    function createKey(text) {
        return `<kbd class="kv-dialog-key">${text}</kbd>`;
    }
    
    // Shortcuts based on user's OS (these don't change when keyboard layout changes)
    const closeShortcutMac = `${createKey('option')}+${createKey('\\')}`;
    const closeShortcutWin = `${createKey('Alt')}+${createKey('\\')}`;
    const themeShortcutMac = `${createKey('option')}+${createKey('T')}`;
    const themeShortcutWin = `${createKey('Alt')}+${createKey('T')}`;
    
    // Get shortcuts based on detected OS
    const closeShortcut = isMacOS ? closeShortcutMac : closeShortcutWin;
    const themeShortcut = isMacOS ? themeShortcutMac : themeShortcutWin;
    
    // Create iframe for complete style isolation
    const iframe = document.createElement('iframe');
    iframe.id = 'keyboard-visualizer-iframe';
    iframe.style.cssText = 'position: fixed !important; bottom: 0 !important; left: 0 !important; width: 100vw !important; height: 316px !important; border: none !important; z-index: 2147483647 !important; pointer-events: auto !important; background: transparent !important;';
    iframe.setAttribute('title', 'Keyboard Demo Tool');
    iframe.setAttribute('aria-label', 'Keyboard visualization panel');
    
    // Build iframe content with complete CSS reset and Figma-matched styles
    iframe.srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale="1.0">
    <title>Keyboard Demo Tool</title>
    <style>
        /* ============================================
           COMPLETE CSS RESET - Neutralize host page styles
           ============================================ */
        *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline;
            line-height: normal;
            text-decoration: none;
            list-style: none;
            quotes: none;
            background: transparent;
            color: inherit;
        }
        
        html {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
            text-size-adjust: 100%;
        }
        
        html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }
        
        body {
            /* SF Compact with robust fallbacks for all platforms */
            font-family: 'SF Compact', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;
            font-size: 16px;
            font-weight: 400;
            line-height: 1;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        button {
            cursor: pointer;
            font-family: inherit;
            border: none;
            background: none;
            padding: 0;
            margin: 0;
        }
        
        /* ============================================
           CSS CUSTOM PROPERTIES - Design tokens from Figma
           ============================================ */
        :root {
            /* Light theme (default) */
            --kv-bg: #f5f5f5;
            --kv-key-bg: #f5f5f5;
            --kv-key-border: #909090;
            --kv-key-text: #000000;
            --kv-btn-bg: transparent;
            --kv-btn-border: transparent;
            --kv-btn-text: #000000;
            --kv-btn-active-bg: #007aff;
            --kv-btn-active-border: #0070c0;
            --kv-btn-active-text: #ffffff;
            --kv-active-bg: #007aff;
            --kv-active-border: #007aff;
            --kv-active-text: #ffffff;
            --kv-dialog-bg: #ffffff;
            --kv-dialog-text: #000000;
            --kv-dialog-key-bg: #ffffff;
            --kv-dialog-key-border: #d1d1d6;
            --kv-link: #007aff;
            --kv-link-hover: #005bb5;
            --kv-backdrop: rgba(0, 0, 0, 0.5);
            
            /* Sizing - from Figma measurements */
            --kv-key-height: 36px;
            --kv-key-min-width: 40px;
            --kv-key-radius: 4px;
            --kv-key-gap: 4px;
            --kv-row-gap: 8px;
            --kv-btn-size: 40px;
            --kv-btn-radius: 80px;
            --kv-btn-gap: 2px;
            --kv-icon-size: 24px;
            --kv-container-padding: 52px 8px 20px 8px;
            --kv-keyboard-width: 636px;
        }
        
        /* Dark theme overrides */
        .dark-mode {
            --kv-bg: #1a1a1a;
            --kv-key-bg: #2a2a2a;
            --kv-key-border: #444444;
            --kv-key-text: #ffffff;
            --kv-btn-text: #ffffff;
            --kv-dialog-bg: #1a1a1a;
            --kv-dialog-text: #ffffff;
            --kv-dialog-key-bg: #1a1a1a;
            --kv-dialog-key-border: #d1d1d6;
            --kv-backdrop: rgba(0, 0, 0, 0.85);
        }
        
        /* ============================================
           MAIN CONTAINER
           ============================================ */
        #keyboard-visualizer {
            position: relative;
            width: 100%;
            height: 100%;
            background: var(--kv-bg);
            padding: var(--kv-container-padding);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            overflow-x: auto;
            overflow-y: hidden;
        }
        
        /* ============================================
           TOOLBAR - Circular buttons top-right
           ============================================ */
        .kv-controls {
            position: absolute;
            top: 6px;
            right: 0;
            padding-right: 8px;
            z-index: 10;
        }
        
        .kv-buttons {
            display: flex;
            flex-direction: row;
            gap: var(--kv-btn-gap);
            align-items: center;
        }
        
        .kv-btn {
            width: var(--kv-btn-size);
            height: var(--kv-btn-size);
            border-radius: var(--kv-btn-radius);
            background: var(--kv-btn-bg);
            border: 1px solid var(--kv-btn-border);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--kv-btn-text);
            transition: background 0.15s ease, border-color 0.15s ease;
            flex-shrink: 0;
        }
        
        .kv-btn:hover {
            background: rgba(0, 122, 255, 0.1);
            border-color: rgba(0, 122, 255, 0.4);
        }
        
        .kv-btn:focus {
            outline: 2px solid var(--kv-btn-active-bg);
            outline-offset: 2px;
        }
        
        .kv-btn:focus:not(:focus-visible) {
            outline: none;
        }
        
        .kv-btn:focus-visible {
            outline: 2px solid var(--kv-btn-active-bg);
            outline-offset: 2px;
        }
        
        .kv-btn.active {
            background: var(--kv-btn-active-bg);
            border-color: var(--kv-btn-active-border);
            color: var(--kv-btn-active-text);
        }
        
        .kv-btn.active:hover {
            background: var(--kv-btn-active-bg);
        }
        
        .kv-btn svg {
            width: var(--kv-icon-size);
            height: var(--kv-icon-size);
            display: block;
            flex-shrink: 0;
        }
        
        .kv-btn svg path {
            fill: currentColor;
            transition: fill 0.15s ease;
        }
        
        .kv-btn-emoji {
            font-size: 22px;
            line-height: 1;
        }
        
        /* ============================================
           KEYBOARD LAYOUT - Matches Figma 1280 frame
           ============================================ */
        .kv-keyboard {
            display: flex;
            flex-direction: column;
            gap: var(--kv-row-gap);
            width: var(--kv-keyboard-width);
            max-width: 100%;
        }
        
        .kv-keyboard-row {
            display: flex;
            gap: var(--kv-key-gap);
            width: 100%;
        }
        
        .kv-keyboard-row-function {
            justify-content: flex-start;
        }
        
        /* ============================================
           KEYBOARD KEYS
           ============================================ */
        .kv-key {
            min-width: var(--kv-key-min-width);
            height: var(--kv-key-height);
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--kv-key-bg);
            border: 1px solid var(--kv-key-border);
            border-radius: var(--kv-key-radius);
            font-size: 16px;
            font-weight: 400;
            color: var(--kv-key-text);
            transition: background 0.1s ease, border-color 0.1s ease, transform 0.1s ease;
            user-select: none;
            pointer-events: none;
            padding: 9px 8px;
            white-space: nowrap;
            flex-shrink: 0;
        }
        
        .kv-key.active {
            background: var(--kv-active-bg);
            border-color: var(--kv-active-border);
            color: var(--kv-active-text);
            transform: translateY(1px);
        }
        
        /* Special key widths - exact Figma measurements for right-edge alignment */
        /* Function row keys - 44px each */
        .kv-key-fn { width: 44px; min-width: 44px; padding: 9px 4px; }
        .kv-key-esc { width: 60px; min-width: 60px; justify-content: flex-start; }
        
        /* Number row */
        .kv-key-delete { width: 64px; min-width: 64px; }
        
        /* QWERTY row */
        .kv-key-tab { width: 63px; min-width: 63px; justify-content: flex-start; }
        
        /* Home row */
        .kv-key-caps { width: 85px; min-width: 85px; justify-content: flex-start; }
        .kv-key-return { width: 62px; min-width: 62px; }
        
        /* Shift row - calculated: (636 - 10*40 - 11*4) / 2 = 96px */
        .kv-key-shift-l { width: 96px; min-width: 96px; justify-content: flex-start; }
        .kv-key-shift-r { width: 96px; min-width: 96px; justify-content: flex-end; }
        
        /* Bottom row */
        .kv-key-control-l { width: 69px; min-width: 69px; justify-content: flex-start; }
        .kv-key-control-r { width: 61px; min-width: 61px; }
        .kv-key-alt { width: 40px; min-width: 40px; }
        .kv-key-spacebar-win { width: 233px; min-width: 233px; }
        
        /* Mac-specific keys */
        .kv-key-option { width: 56px; min-width: 56px; }
        .kv-key-cmd { width: 40px; min-width: 40px; }
        .kv-key-spacebar-mac { width: 113px; min-width: 113px; }
        
        /* ============================================
           INFO DIALOG - Matches Figma 480x300px
           ============================================ */
        .kv-dialog-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--kv-backdrop);
            z-index: 1000;
            display: none;
            align-items: center;
            justify-content: center;
        }
        
        .kv-dialog-backdrop.visible {
            display: flex;
        }
        
        .kv-dialog {
            background: var(--kv-dialog-bg);
            border-radius: 12px;
            width: 480px;
            height: 300px;
            max-width: 95vw;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            position: relative;
            color: var(--kv-dialog-text);
        }
        
        .kv-dialog-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 24px;
            height: 24px;
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--kv-btn-text);
            cursor: pointer;
            padding: 0;
        }
        
        .kv-dialog-close:hover {
            opacity: 0.7;
        }
        
        .kv-dialog-close:focus {
            outline: 2px solid var(--kv-btn-active-bg);
            outline-offset: 2px;
        }
        
        .kv-dialog-close:focus:not(:focus-visible) {
            outline: none;
        }
        
        .kv-dialog-close:focus-visible {
            outline: 2px solid var(--kv-btn-active-bg);
            outline-offset: 2px;
        }
        
        .kv-dialog-close svg {
            width: 24px;
            height: 24px;
            display: block;
        }
        
        .kv-dialog-close svg path {
            fill: currentColor;
        }
        
        .kv-dialog-title {
            position: absolute;
            top: 16px;
            left: 16px;
            font-size: 16px;
            font-weight: 700;
            line-height: 24px;
            margin: 0;
            padding: 0;
        }
        
        .kv-dialog-content {
            position: absolute;
            top: 64px;
            left: 16px;
            right: 16px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .kv-dialog-section {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 16px;
            line-height: 24px;
        }
        
        .kv-dialog-section-title {
            font-weight: 700;
            font-size: 16px;
            line-height: 24px;
            margin: 0;
        }
        
        .kv-dialog-shortcut {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            line-height: 24px;
        }
        
        .kv-dialog-shortcut-label {
            font-weight: 400;
        }
        
        .kv-dialog-keys {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .kv-dialog-key {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: var(--kv-dialog-key-bg);
            border: 1px solid var(--kv-dialog-key-border);
            border-radius: 4px;
            padding: 9px 8px;
            font-family: inherit;
            font-size: 16px;
            font-weight: 400;
            min-width: 40px;
            height: 36px;
            text-align: center;
            white-space: nowrap;
            box-sizing: border-box;
        }
        
        .kv-dialog-plus {
            font-size: 16px;
            font-weight: 400;
        }
        
        /* Keyboard layout row */
        .kv-dialog-layout-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .kv-dialog-layout-label {
            font-weight: 700;
            font-size: 16px;
            line-height: 24px;
        }
        
        /* Segmented toggle control */
        .kv-layout-toggle {
            display: flex;
            align-items: center;
        }
        
        .kv-layout-toggle-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            padding: 6px 8px;
            font-family: inherit;
            font-size: 16px;
            font-weight: 400;
            cursor: pointer;
            border: 1px solid var(--kv-dialog-key-border);
            background: var(--kv-dialog-key-bg);
            color: var(--kv-dialog-text);
            margin-right: -1px;
            transition: background 0.15s ease, border-color 0.15s ease;
        }
        
        .kv-layout-toggle-btn:first-child {
            border-radius: 4px 0 0 4px;
        }
        
        .kv-layout-toggle-btn:last-child {
            border-radius: 0 4px 4px 0;
            margin-right: 0;
        }
        
        .kv-layout-toggle-btn:hover:not(.active) {
            background: rgba(0, 122, 255, 0.1);
        }
        
        .kv-layout-toggle-btn.active {
            background: var(--kv-active-bg);
            border-color: #0070c0;
            color: #ffffff;
            font-weight: 700;
            z-index: 1;
        }
        
        .kv-layout-toggle-btn:focus {
            outline: 2px solid var(--kv-btn-active-bg);
            outline-offset: 2px;
            z-index: 2;
        }
        
        .kv-layout-toggle-btn:focus:not(:focus-visible) {
            outline: none;
        }
        
        .kv-layout-toggle-btn:focus-visible {
            outline: 2px solid var(--kv-btn-active-bg);
            outline-offset: 2px;
            z-index: 2;
        }
        
        /* More info section */
        .kv-dialog-more-info {
            font-size: 16px;
            line-height: 24px;
        }
        
        .kv-dialog-more-info strong {
            font-weight: 700;
        }
        
        .kv-dialog-link {
            color: var(--kv-link);
            text-decoration: underline;
            font-weight: 400;
        }
        
        .kv-dialog-link:hover {
            color: var(--kv-link-hover);
        }
        
        /* ============================================
           RESPONSIVE BREAKPOINTS
           ============================================ */
        
        /* Tablet breakpoint - 800px */
        @media (max-width: 800px) {
            :root {
                --kv-key-height: 32px;
                --kv-key-min-width: 35px;
                --kv-key-gap: 3px;
                --kv-row-gap: 6px;
                --kv-keyboard-width: 560px;
                --kv-container-padding: 48px 8px 16px 8px;
            }
            
            .kv-key {
                font-size: 14px;
                padding: 7px 6px;
            }
            
            /* Scale all special keys proportionally (560/636 = 0.88) */
            .kv-key-fn { width: 39px; min-width: 39px; }
            .kv-key-esc { width: 53px; min-width: 53px; }
            .kv-key-tab { width: 55px; min-width: 55px; }
            .kv-key-caps { width: 75px; min-width: 75px; }
            .kv-key-delete { width: 56px; min-width: 56px; }
            .kv-key-return { width: 55px; min-width: 55px; }
            .kv-key-shift-l { width: 84px; min-width: 84px; }
            .kv-key-shift-r { width: 84px; min-width: 84px; }
            .kv-key-control-l { width: 61px; min-width: 61px; }
            .kv-key-control-r { width: 54px; min-width: 54px; }
            .kv-key-alt { width: 35px; min-width: 35px; }
            .kv-key-spacebar-win { width: 205px; min-width: 205px; }
            .kv-key-option { width: 49px; min-width: 49px; }
            .kv-key-cmd { width: 35px; min-width: 35px; }
            .kv-key-spacebar-mac { width: 99px; min-width: 99px; }
        }
        
        /* Mobile breakpoint - 520px */
        @media (max-width: 520px) {
            :root {
                --kv-key-height: 28px;
                --kv-key-min-width: 28px;
                --kv-key-gap: 2px;
                --kv-row-gap: 4px;
                --kv-btn-size: 36px;
                --kv-icon-size: 24px;
                --kv-keyboard-width: 450px;
                --kv-container-padding: 44px 8px 12px 8px;
            }
            
            .kv-key {
                font-size: 11px;
                padding: 5px 3px;
            }
            
            .kv-key-fn { width: 31px; min-width: 31px; padding: 5px 2px; }
            .kv-key-esc { width: 42px; min-width: 42px; }
            .kv-key-tab { width: 44px; min-width: 44px; }
            .kv-key-caps { width: 60px; min-width: 60px; }
            .kv-key-delete { width: 45px; min-width: 45px; }
            .kv-key-return { width: 44px; min-width: 44px; }
            .kv-key-shift-l { width: 68px; min-width: 68px; }
            .kv-key-shift-r { width: 68px; min-width: 68px; }
            .kv-key-control-l { width: 49px; min-width: 49px; }
            .kv-key-control-r { width: 43px; min-width: 43px; }
            .kv-key-alt { width: 28px; min-width: 28px; }
            .kv-key-spacebar-win { width: 165px; min-width: 165px; }
            .kv-key-option { width: 40px; min-width: 40px; }
            .kv-key-cmd { width: 28px; min-width: 28px; }
            .kv-key-spacebar-mac { width: 80px; min-width: 80px; }
            
            .kv-btn-emoji {
                font-size: 18px;
            }
            
            .kv-controls {
                padding-right: 4px;
            }
        }
        
        /* Extra small - 380px */
        @media (max-width: 380px) {
            :root {
                --kv-key-height: 24px;
                --kv-key-min-width: 22px;
                --kv-key-gap: 2px;
                --kv-row-gap: 3px;
                --kv-btn-size: 32px;
                --kv-icon-size: 24px;
                --kv-keyboard-width: 350px;
            }
            
            .kv-key {
                font-size: 9px;
                padding: 4px 2px;
            }
            
            .kv-key-fn { width: 24px; min-width: 24px; }
            .kv-key-esc { width: 33px; min-width: 33px; }
            .kv-key-tab { width: 35px; min-width: 35px; }
            .kv-key-caps { width: 47px; min-width: 47px; }
            .kv-key-delete { width: 35px; min-width: 35px; }
            .kv-key-return { width: 34px; min-width: 34px; }
            .kv-key-shift-l { width: 53px; min-width: 53px; }
            .kv-key-shift-r { width: 53px; min-width: 53px; }
            .kv-key-control-l { width: 38px; min-width: 38px; }
            .kv-key-control-r { width: 34px; min-width: 34px; }
            .kv-key-alt { width: 22px; min-width: 22px; }
            .kv-key-spacebar-win { width: 128px; min-width: 128px; }
            .kv-key-option { width: 31px; min-width: 31px; }
            .kv-key-cmd { width: 22px; min-width: 22px; }
            .kv-key-spacebar-mac { width: 62px; min-width: 62px; }
            
            .kv-btn-emoji {
                font-size: 16px;
            }
        }
        
        /* Dialog responsive - tablet */
        @media (max-width: 520px) {
            .kv-dialog {
                width: 95vw;
                height: auto;
                min-height: 280px;
            }
            
            .kv-dialog-content {
                gap: 16px;
            }
            
            .kv-dialog-key {
                height: 32px;
                min-width: 36px;
                padding: 7px 6px;
                font-size: 14px;
            }
            
            .kv-layout-toggle-btn {
                padding: 5px 6px;
                font-size: 14px;
            }
        }
        
        /* Screen reader only text */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    </style>
</head>
<body>
    <aside id="keyboard-visualizer" role="complementary" aria-label="Keyboard Demo Tool - Persistent Toolbar">
        <!-- Toolbar: Info, Light, Dark, Close -->
        <div class="kv-controls" role="toolbar" aria-label="Keyboard Demo Tool Controls">
            <div class="kv-buttons">
                <button class="kv-btn kv-info" aria-label="Show information" title="Information">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.008 9.54797C14.241 9.54797 9.56396 14.224 9.56396 19.992C9.56396 25.76 14.24 30.436 20.008 30.436C25.776 30.436 30.452 25.76 30.452 19.992C30.452 14.224 25.776 9.54797 20.008 9.54797ZM21.332 25.976C21.332 26.711 20.734 27.308 20 27.308C19.266 27.308 18.668 26.71 18.668 25.976V17.981C18.668 17.246 19.266 16.649 20 16.649C20.734 16.649 21.332 17.247 21.332 17.981V25.976ZM20 15.459C19.165 15.459 18.488 14.782 18.488 13.947C18.488 13.112 19.165 12.435 20 12.435C20.835 12.435 21.512 13.112 21.512 13.947C21.512 14.782 20.835 15.459 20 15.459Z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="kv-btn kv-theme-light" aria-label="Light mode" aria-pressed="false" title="Light mode">
                    <span class="kv-btn-emoji" aria-hidden="true">☀️</span>
                </button>
                <button class="kv-btn kv-theme-dark" aria-label="Dark mode" aria-pressed="false" title="Dark mode">
                    <span class="kv-btn-emoji" aria-hidden="true">🌙</span>
                </button>
                <button class="kv-btn kv-close" aria-label="Close keyboard demo tool (${closeShortcutSimple})" title="Close (${closeShortcutSimple})">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.43201 17.568C6.74401 17.88 7.25201 17.88 7.56501 17.568L12 13.133L16.435 17.568C16.747 17.88 17.255 17.88 17.568 17.568C17.881 17.256 17.88 16.748 17.568 16.435L13.133 12L17.568 7.56501C17.88 7.25301 17.88 6.74501 17.568 6.43201C17.256 6.11901 16.748 6.12001 16.435 6.43201L12 10.867L7.56501 6.43201C7.25301 6.12001 6.74501 6.12001 6.43201 6.43201C6.11901 6.74401 6.12001 7.25201 6.43201 7.56501L10.867 12L6.43201 16.435C6.12001 16.747 6.12001 17.255 6.43201 17.568Z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- Keyboard Layout - Windows -->
        <div class="kv-keyboard kv-keyboard-windows" role="presentation" ${savedKeyboardLayout === 'windows' ? '' : 'style="display: none;"'}>
            <!-- Row 1: Function keys -->
            <div class="kv-keyboard-row kv-keyboard-row-function">
                <div class="kv-key kv-key-esc kv-key-fn" data-key="Escape">esc</div>
                <div class="kv-key kv-key-fn" data-key="F1">F1</div>
                <div class="kv-key kv-key-fn" data-key="F2">F2</div>
                <div class="kv-key kv-key-fn" data-key="F3">F3</div>
                <div class="kv-key kv-key-fn" data-key="F4">F4</div>
                <div class="kv-key kv-key-fn" data-key="F5">F5</div>
                <div class="kv-key kv-key-fn" data-key="F6">F6</div>
                <div class="kv-key kv-key-fn" data-key="F7">F7</div>
                <div class="kv-key kv-key-fn" data-key="F8">F8</div>
                <div class="kv-key kv-key-fn" data-key="F9">F9</div>
                <div class="kv-key kv-key-fn" data-key="F10">F10</div>
                <div class="kv-key kv-key-fn" data-key="F11">F11</div>
                <div class="kv-key kv-key-fn" data-key="F12">F12</div>
            </div>
            
            <!-- Row 2: Number row -->
            <div class="kv-keyboard-row">
                <div class="kv-key" data-key="\`">\`</div>
                <div class="kv-key" data-key="1">1</div>
                <div class="kv-key" data-key="2">2</div>
                <div class="kv-key" data-key="3">3</div>
                <div class="kv-key" data-key="4">4</div>
                <div class="kv-key" data-key="5">5</div>
                <div class="kv-key" data-key="6">6</div>
                <div class="kv-key" data-key="7">7</div>
                <div class="kv-key" data-key="8">8</div>
                <div class="kv-key" data-key="9">9</div>
                <div class="kv-key" data-key="0">0</div>
                <div class="kv-key" data-key="-">-</div>
                <div class="kv-key" data-key="=">=</div>
                <div class="kv-key kv-key-delete" data-key="Backspace">delete</div>
            </div>
            
            <!-- Row 3: QWERTY row -->
            <div class="kv-keyboard-row">
                <div class="kv-key kv-key-tab" data-key="Tab">tab</div>
                <div class="kv-key" data-key="q">Q</div>
                <div class="kv-key" data-key="w">W</div>
                <div class="kv-key" data-key="e">E</div>
                <div class="kv-key" data-key="r">R</div>
                <div class="kv-key" data-key="t">T</div>
                <div class="kv-key" data-key="y">Y</div>
                <div class="kv-key" data-key="u">U</div>
                <div class="kv-key" data-key="i">I</div>
                <div class="kv-key" data-key="o">O</div>
                <div class="kv-key" data-key="p">P</div>
                <div class="kv-key" data-key="[">[</div>
                <div class="kv-key" data-key="]">]</div>
                <div class="kv-key" data-key="\\">\\</div>
            </div>
            
            <!-- Row 4: Home row -->
            <div class="kv-keyboard-row">
                <div class="kv-key kv-key-caps" data-key="CapsLock">caps lock</div>
                <div class="kv-key" data-key="a">A</div>
                <div class="kv-key" data-key="s">S</div>
                <div class="kv-key" data-key="d">D</div>
                <div class="kv-key" data-key="f">F</div>
                <div class="kv-key" data-key="g">G</div>
                <div class="kv-key" data-key="h">H</div>
                <div class="kv-key" data-key="j">J</div>
                <div class="kv-key" data-key="k">K</div>
                <div class="kv-key" data-key="l">L</div>
                <div class="kv-key" data-key=";">;</div>
                <div class="kv-key" data-key="'">'</div>
                <div class="kv-key kv-key-return" data-key="Enter">enter</div>
            </div>
            
            <!-- Row 5: Shift row -->
            <div class="kv-keyboard-row">
                <div class="kv-key kv-key-shift-l" data-key="Shift">shift</div>
                <div class="kv-key" data-key="z">Z</div>
                <div class="kv-key" data-key="x">X</div>
                <div class="kv-key" data-key="c">C</div>
                <div class="kv-key" data-key="v">V</div>
                <div class="kv-key" data-key="b">B</div>
                <div class="kv-key" data-key="n">N</div>
                <div class="kv-key" data-key="m">M</div>
                <div class="kv-key" data-key=",">,</div>
                <div class="kv-key" data-key=".">.</div>
                <div class="kv-key" data-key="/">/</div>
                <div class="kv-key kv-key-shift-r" data-key="Shift">shift</div>
            </div>
            
            <!-- Row 6: Bottom row - Windows layout -->
            <div class="kv-keyboard-row">
                <div class="kv-key kv-key-control-l" data-key="Control">control</div>
                <div class="kv-key kv-key-alt" data-key="Alt">alt</div>
                <div class="kv-key kv-key-spacebar kv-key-spacebar-win" data-key=" ">space</div>
                <div class="kv-key kv-key-alt" data-key="Alt">alt</div>
                <div class="kv-key kv-key-control-r" data-key="Control">control</div>
                <div class="kv-key" data-key="ArrowLeft">←</div>
                <div class="kv-key" data-key="ArrowUp">↑</div>
                <div class="kv-key" data-key="ArrowDown">↓</div>
                <div class="kv-key" data-key="ArrowRight">→</div>
            </div>
        </div>
        
        <!-- Keyboard Layout - Mac -->
        <div class="kv-keyboard kv-keyboard-mac" role="presentation" ${savedKeyboardLayout === 'mac' ? '' : 'style="display: none;"'}>
            <!-- Row 1: Function keys -->
            <div class="kv-keyboard-row kv-keyboard-row-function">
                <div class="kv-key kv-key-esc kv-key-fn" data-key="Escape">esc</div>
                <div class="kv-key kv-key-fn" data-key="F1">F1</div>
                <div class="kv-key kv-key-fn" data-key="F2">F2</div>
                <div class="kv-key kv-key-fn" data-key="F3">F3</div>
                <div class="kv-key kv-key-fn" data-key="F4">F4</div>
                <div class="kv-key kv-key-fn" data-key="F5">F5</div>
                <div class="kv-key kv-key-fn" data-key="F6">F6</div>
                <div class="kv-key kv-key-fn" data-key="F7">F7</div>
                <div class="kv-key kv-key-fn" data-key="F8">F8</div>
                <div class="kv-key kv-key-fn" data-key="F9">F9</div>
                <div class="kv-key kv-key-fn" data-key="F10">F10</div>
                <div class="kv-key kv-key-fn" data-key="F11">F11</div>
                <div class="kv-key kv-key-fn" data-key="F12">F12</div>
            </div>
            
            <!-- Row 2: Number row -->
            <div class="kv-keyboard-row">
                <div class="kv-key" data-key="\`">\`</div>
                <div class="kv-key" data-key="1">1</div>
                <div class="kv-key" data-key="2">2</div>
                <div class="kv-key" data-key="3">3</div>
                <div class="kv-key" data-key="4">4</div>
                <div class="kv-key" data-key="5">5</div>
                <div class="kv-key" data-key="6">6</div>
                <div class="kv-key" data-key="7">7</div>
                <div class="kv-key" data-key="8">8</div>
                <div class="kv-key" data-key="9">9</div>
                <div class="kv-key" data-key="0">0</div>
                <div class="kv-key" data-key="-">-</div>
                <div class="kv-key" data-key="=">=</div>
                <div class="kv-key kv-key-delete" data-key="Backspace">delete</div>
            </div>
            
            <!-- Row 3: QWERTY row -->
            <div class="kv-keyboard-row">
                <div class="kv-key kv-key-tab" data-key="Tab">tab</div>
                <div class="kv-key" data-key="q">Q</div>
                <div class="kv-key" data-key="w">W</div>
                <div class="kv-key" data-key="e">E</div>
                <div class="kv-key" data-key="r">R</div>
                <div class="kv-key" data-key="t">T</div>
                <div class="kv-key" data-key="y">Y</div>
                <div class="kv-key" data-key="u">U</div>
                <div class="kv-key" data-key="i">I</div>
                <div class="kv-key" data-key="o">O</div>
                <div class="kv-key" data-key="p">P</div>
                <div class="kv-key" data-key="[">[</div>
                <div class="kv-key" data-key="]">]</div>
                <div class="kv-key" data-key="\\">\\</div>
            </div>
            
            <!-- Row 4: Home row -->
            <div class="kv-keyboard-row">
                <div class="kv-key kv-key-caps" data-key="CapsLock">caps lock</div>
                <div class="kv-key" data-key="a">A</div>
                <div class="kv-key" data-key="s">S</div>
                <div class="kv-key" data-key="d">D</div>
                <div class="kv-key" data-key="f">F</div>
                <div class="kv-key" data-key="g">G</div>
                <div class="kv-key" data-key="h">H</div>
                <div class="kv-key" data-key="j">J</div>
                <div class="kv-key" data-key="k">K</div>
                <div class="kv-key" data-key="l">L</div>
                <div class="kv-key" data-key=";">;</div>
                <div class="kv-key" data-key="'">'</div>
                <div class="kv-key kv-key-return" data-key="Enter">return</div>
            </div>
            
            <!-- Row 5: Shift row -->
            <div class="kv-keyboard-row">
                <div class="kv-key kv-key-shift-l" data-key="Shift">shift</div>
                <div class="kv-key" data-key="z">Z</div>
                <div class="kv-key" data-key="x">X</div>
                <div class="kv-key" data-key="c">C</div>
                <div class="kv-key" data-key="v">V</div>
                <div class="kv-key" data-key="b">B</div>
                <div class="kv-key" data-key="n">N</div>
                <div class="kv-key" data-key="m">M</div>
                <div class="kv-key" data-key=",">,</div>
                <div class="kv-key" data-key=".">.</div>
                <div class="kv-key" data-key="/">/</div>
                <div class="kv-key kv-key-shift-r" data-key="Shift">shift</div>
            </div>
            
            <!-- Row 6: Bottom row - Mac layout -->
            <div class="kv-keyboard-row">
                <div class="kv-key kv-key-control-l" data-key="Control">control</div>
                <div class="kv-key kv-key-option" data-key="Alt">option</div>
                <div class="kv-key kv-key-cmd" data-key="Meta">⌘</div>
                <div class="kv-key kv-key-spacebar kv-key-spacebar-mac" data-key=" ">space</div>
                <div class="kv-key kv-key-cmd" data-key="Meta">⌘</div>
                <div class="kv-key kv-key-option" data-key="Alt">option</div>
                <div class="kv-key kv-key-control-r" data-key="Control">control</div>
                <div class="kv-key" data-key="ArrowLeft">←</div>
                <div class="kv-key" data-key="ArrowUp">↑</div>
                <div class="kv-key" data-key="ArrowDown">↓</div>
                <div class="kv-key" data-key="ArrowRight">→</div>
            </div>
        </div>
        
        <!-- Info Dialog - Figma 480x300px -->
        <div class="kv-dialog-backdrop" id="kv-dialog-backdrop">
            <div class="kv-dialog" role="dialog" aria-labelledby="kv-dialog-title" aria-modal="true">
                <button class="kv-dialog-close" aria-label="Close dialog">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6.43201 17.568C6.74401 17.88 7.25201 17.88 7.56501 17.568L12 13.133L16.435 17.568C16.747 17.88 17.255 17.88 17.568 17.568C17.881 17.256 17.88 16.748 17.568 16.435L13.133 12L17.568 7.56501C17.88 7.25301 17.88 6.74501 17.568 6.43201C17.256 6.11901 16.748 6.12001 16.435 6.43201L12 10.867L7.56501 6.43201C7.25301 6.12001 6.74501 6.12001 6.43201 6.43201C6.11901 6.74401 6.12001 7.25201 6.43201 7.56501L10.867 12L6.43201 16.435C6.12001 16.747 6.12001 17.255 6.43201 17.568Z" fill="currentColor"/>
                    </svg>
                </button>
                <div class="kv-dialog-title" id="kv-dialog-title">Information about Keyboard Demo Tool</div>
                <div class="kv-dialog-content">
                    <!-- Shortcuts section -->
                    <div class="kv-dialog-section">
                        <div class="kv-dialog-section-title">Shortcuts for ${osName}</div>
                        <div class="kv-dialog-shortcut">
                            <span class="kv-dialog-shortcut-label">Close this bookmarklet:</span>
                            <div class="kv-dialog-keys">
                                <kbd class="kv-dialog-key">${isMacOS ? 'option' : 'Alt'}</kbd>
                                <span class="kv-dialog-plus">+</span>
                                <kbd class="kv-dialog-key">\\</kbd>
                            </div>
                        </div>
                        <div class="kv-dialog-shortcut">
                            <span class="kv-dialog-shortcut-label">Toggle theme:</span>
                            <div class="kv-dialog-keys">
                                <kbd class="kv-dialog-key">${isMacOS ? 'option' : 'Alt'}</kbd>
                                <span class="kv-dialog-plus">+</span>
                                <kbd class="kv-dialog-key">T</kbd>
                            </div>
                        </div>
                    </div>
                    <!-- Keyboard layout toggle -->
                    <div class="kv-dialog-layout-row">
                        <span class="kv-dialog-layout-label">Keyboard layout:</span>
                        <div class="kv-layout-toggle" role="radiogroup" aria-label="Keyboard layout selection">
                            <button class="kv-layout-toggle-btn kv-toggle-layout-win ${savedKeyboardLayout === 'windows' ? 'active' : ''}" data-layout="windows" role="radio" aria-checked="${savedKeyboardLayout === 'windows' ? 'true' : 'false'}">Windows</button>
                            <button class="kv-layout-toggle-btn kv-toggle-layout-mac ${savedKeyboardLayout === 'mac' ? 'active' : ''}" data-layout="mac" role="radio" aria-checked="${savedKeyboardLayout === 'mac' ? 'true' : 'false'}">Mac</button>
                        </div>
                    </div>
                    <!-- More info -->
                    <div class="kv-dialog-more-info">
                        <strong>More info:</strong> <a href="https://lindadesign.net/bookmarklet-keyboard-demo/" target="_blank" rel="noopener noreferrer" class="kv-dialog-link">lindadesign.net/bookmarklet-keyboard-demo<span class="sr-only"> (opens in new tab)</span></a>
                    </div>
                </div>
            </div>
        </div>
    </aside>
    
    <script>
        (function() {
            'use strict';
            
            // Get references
            const container = document.querySelector('#keyboard-visualizer');
            const lightBtn = document.querySelector('.kv-theme-light');
            const darkBtn = document.querySelector('.kv-theme-dark');
            const closeBtn = document.querySelector('.kv-close');
            const infoBtn = document.querySelector('.kv-info');
            const dialogBackdrop = document.querySelector('.kv-dialog-backdrop');
            const dialogCloseBtn = document.querySelector('.kv-dialog-close');
            const toggleLayoutMacBtn = document.querySelector('.kv-toggle-layout-mac');
            const toggleLayoutWinBtn = document.querySelector('.kv-toggle-layout-win');
            const keyboardMac = document.querySelector('.kv-keyboard-mac');
            const keyboardWin = document.querySelector('.kv-keyboard-windows');
            
            // Current keyboard layout
            let currentKeyboardLayout = '${savedKeyboardLayout}';
            
            // Build key map for efficient lookups
            const keyMap = new Map();
            document.querySelectorAll('.kv-key').forEach(function(key) {
                const keyValue = key.getAttribute('data-key');
                if (!keyMap.has(keyValue)) {
                    keyMap.set(keyValue, []);
                }
                keyMap.get(keyValue).push(key);
            });
            
            // Theme management
            let isDarkMode = false;
            
            function setTheme(dark) {
                isDarkMode = dark;
                if (dark) {
                    container.classList.add('dark-mode');
                    lightBtn.classList.remove('active');
                    darkBtn.classList.add('active');
                    lightBtn.setAttribute('aria-pressed', 'false');
                    darkBtn.setAttribute('aria-pressed', 'true');
                } else {
                    container.classList.remove('dark-mode');
                    lightBtn.classList.add('active');
                    darkBtn.classList.remove('active');
                    lightBtn.setAttribute('aria-pressed', 'true');
                    darkBtn.setAttribute('aria-pressed', 'false');
                }
                
                // Notify parent to save theme preference
                window.parent.postMessage({ type: 'saveTheme', theme: dark ? 'dark' : 'light' }, '*');
            }
            
            // Theme button handlers
            lightBtn.addEventListener('click', function() { setTheme(false); });
            darkBtn.addEventListener('click', function() { setTheme(true); });
            
            // Close button handler
            closeBtn.addEventListener('click', function() {
                window.parent.postMessage({ type: 'close' }, '*');
            });
            
            // Focus trap for modal dialog (accessibility)
            var focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
            var firstFocusableElement;
            var lastFocusableElement;
            
            function updateFocusableElements() {
                var dialog = document.querySelector('.kv-dialog');
                var focusables = dialog.querySelectorAll(focusableSelector);
                firstFocusableElement = focusables[0];
                lastFocusableElement = focusables[focusables.length - 1];
            }
            
            // Dialog keyboard handler (Escape to close, Tab trap)
            function handleDialogKeydown(e) {
                // Close dialog on Escape
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeDialog();
                    return;
                }
                
                // Focus trap on Tab
                if (e.key !== 'Tab') return;
                
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
            
            function openDialog() {
                dialogBackdrop.classList.add('visible');
                infoBtn.classList.add('active');
                updateFocusableElements();
                dialogCloseBtn.focus();
                document.addEventListener('keydown', handleDialogKeydown);
            }
            
            function closeDialog() {
                dialogBackdrop.classList.remove('visible');
                infoBtn.classList.remove('active');
                document.removeEventListener('keydown', handleDialogKeydown);
                infoBtn.focus();
            }
            
            infoBtn.addEventListener('click', openDialog);
            
            dialogCloseBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                closeDialog();
            });
            
            dialogBackdrop.addEventListener('click', function(e) {
                if (e.target === dialogBackdrop) {
                    closeDialog();
                }
            });
            
            // Keyboard layout toggle handlers
            function setKeyboardLayout(layout) {
                currentKeyboardLayout = layout;
                
                // Show/hide keyboards
                if (layout === 'mac') {
                    keyboardMac.style.display = '';
                    keyboardWin.style.display = 'none';
                } else {
                    keyboardMac.style.display = 'none';
                    keyboardWin.style.display = '';
                }
                
                // Update toggle buttons
                toggleLayoutMacBtn.classList.toggle('active', layout === 'mac');
                toggleLayoutWinBtn.classList.toggle('active', layout === 'windows');
                toggleLayoutMacBtn.setAttribute('aria-checked', layout === 'mac' ? 'true' : 'false');
                toggleLayoutWinBtn.setAttribute('aria-checked', layout === 'windows' ? 'true' : 'false');
                
                // Notify parent to save layout preference
                window.parent.postMessage({ type: 'saveKeyboardLayout', layout: layout }, '*');
            }
            
            toggleLayoutMacBtn.addEventListener('click', function() {
                setKeyboardLayout('mac');
            });
            
            toggleLayoutWinBtn.addEventListener('click', function() {
                setKeyboardLayout('windows');
            });
            
            // Key highlighting
            function setKeyHighlight(keyIdentifier, isActive) {
                if (!keyIdentifier) return;
                var keyElements = keyMap.get(keyIdentifier);
                if (keyElements) {
                    keyElements.forEach(function(element) {
                        if (isActive) {
                            element.classList.add('active');
                        } else {
                            element.classList.remove('active');
                        }
                    });
                }
            }
            
            // Listen for messages from parent window
            window.addEventListener('message', function(event) {
                if (event.data.type === 'keydown') {
                    setKeyHighlight(event.data.keyIdentifier, true);
                } else if (event.data.type === 'keyup') {
                    setKeyHighlight(event.data.keyIdentifier, false);
                } else if (event.data.type === 'blur') {
                    // Clear all highlights when window loses focus
                    document.querySelectorAll('.kv-key.active').forEach(function(key) {
                        key.classList.remove('active');
                    });
                } else if (event.data.type === 'setTheme') {
                    setTheme(event.data.theme === 'dark');
                } else if (event.data.type === 'toggleTheme') {
                    setTheme(!isDarkMode);
                }
            });
            
            // IMPORTANT: Handle keyboard shortcuts inside iframe
            // Firefox and Safari don't send key events to parent when iframe has focus
            // This ensures shortcuts work across all browsers
            document.addEventListener('keydown', function(e) {
                var altOnly = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
                if (altOnly && e.code === 'Backslash') {
                    e.preventDefault();
                    window.parent.postMessage({ type: 'close' }, '*');
                } else if (altOnly && e.code === 'KeyT') {
                    e.preventDefault();
                    setTheme(!isDarkMode);
                }
            });
            
            // Request initial theme from parent
            window.parent.postMessage({ type: 'requestTheme' }, '*');
        })();
    </script>
</body>
</html>`;
    
    // Append iframe to body (more reliable across browsers including Safari)
    (document.body || document.documentElement).appendChild(iframe);
    
    // Send initial theme once iframe loads
    iframe.addEventListener('load', function() {
        iframe.contentWindow.postMessage({ type: 'setTheme', theme: savedTheme }, '*');
    });
    
    // Key code to key identifier mapping
    function getKeyIdentifier(code) {
        // Letter keys
        if (code.startsWith('Key')) return code.substring(3).toLowerCase();
        // Digit keys
        if (code.startsWith('Digit')) return code.substring(5);
        // Arrow keys
        if (code.startsWith('Arrow')) return code;
        // Function keys
        if (/^F\d{1,2}$/.test(code)) return code;
        
        // Special keys mapping
        var specialKeyMap = {
            'Escape': 'Escape',
            'Tab': 'Tab',
            'Backspace': 'Backspace',
            'Enter': 'Enter',
            'Space': ' ',
            'ShiftLeft': 'Shift',
            'ShiftRight': 'Shift',
            'ControlLeft': 'Control',
            'ControlRight': 'Control',
            'AltLeft': 'Alt',
            'AltRight': 'Alt',
            'MetaLeft': 'Meta',
            'MetaRight': 'Meta',
            'CapsLock': 'CapsLock',
            'Backquote': '`',
            'Minus': '-',
            'Equal': '=',
            'BracketLeft': '[',
            'BracketRight': ']',
            'Backslash': '\\',
            'Semicolon': ';',
            'Quote': "'",
            'Comma': ',',
            'Period': '.',
            'Slash': '/'
        };
        
        return specialKeyMap[code] || null;
    }
    
    // Keyboard event handlers
    function handleKeyDown(e) {
        // Debug logging (remove in production)
        // console.log('KeyDown:', e.code, e.key, 'alt:', e.altKey, 'ctrl:', e.ctrlKey, 'meta:', e.metaKey);
        
        // Prevent browser defaults for F keys
        if (/^F\d{1,2}$/.test(e.code)) {
            e.preventDefault();
        }
        
        // Prevent Firefox quick find
        if (e.code === 'Slash' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
            e.preventDefault();
        }
        
        // Keyboard shortcuts with Alt/Option key (works on Mac, Windows, Linux)
        // Check altKey is pressed and no other modifiers
        var altOnly = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
        
        if (altOnly) {
            // Alt/Option + \ - Close
            // e.code is 'Backslash' on all platforms
            // e.key varies: '\' on Windows/Linux, '«' on Mac (US), or other chars
            if (e.code === 'Backslash') {
                e.preventDefault();
                e.stopPropagation();
                closeVisualizer();
                return;
            }
            // Alt/Option + T - Toggle theme
            // e.code is 'KeyT' on all platforms
            if (e.code === 'KeyT') {
                e.preventDefault();
                e.stopPropagation();
                iframe.contentWindow.postMessage({ type: 'toggleTheme' }, '*');
                return;
            }
        }
        
        // Special handling for CapsLock (toggle behavior)
        if (e.code === 'CapsLock') {
            e.preventDefault();
            var isCapsLockOn = e.getModifierState('CapsLock');
            var keyIdentifier = getKeyIdentifier(e.code);
            if (isCapsLockOn) {
                iframe.contentWindow.postMessage({ type: 'keydown', keyIdentifier: keyIdentifier }, '*');
            } else {
                iframe.contentWindow.postMessage({ type: 'keyup', keyIdentifier: keyIdentifier }, '*');
            }
            return;
        }
        
        // Send key press to iframe
        if (pressedKeys.has(e.code)) return;
        pressedKeys.add(e.code);
        var keyIdentifier = getKeyIdentifier(e.code);
        iframe.contentWindow.postMessage({ type: 'keydown', keyIdentifier: keyIdentifier }, '*');
    }
    
    function handleKeyUp(e) {
        // Skip CapsLock on keyup (handled specially in keydown)
        if (e.code === 'CapsLock') {
            return;
        }
        
        pressedKeys.delete(e.code);
        var keyIdentifier = getKeyIdentifier(e.code);
        iframe.contentWindow.postMessage({ type: 'keyup', keyIdentifier: keyIdentifier }, '*');
    }
    
    function handleWindowBlur() {
        pressedKeys.clear();
        iframe.contentWindow.postMessage({ type: 'blur' }, '*');
    }
    
    function closeVisualizer() {
        iframe.remove();
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('keyup', handleKeyUp, true);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('message', handleParentMessages);
        document.removeEventListener('focusin', handleFocusIn, true);
        window.keyboardVisualizerActive = false;
    }
    
    // Handle messages from iframe
    function handleParentMessages(event) {
        if (event.data.type === 'close') {
            closeVisualizer();
        } else if (event.data.type === 'saveTheme') {
            try {
                localStorage.setItem('keyboardDemoTool_theme', event.data.theme);
            } catch (e) {
                console.log('Keyboard Demo Tool: Could not save theme preference');
            }
        } else if (event.data.type === 'saveKeyboardLayout') {
            try {
                localStorage.setItem('keyboardDemoTool_keyboardLayout', event.data.layout);
            } catch (e) {
                console.log('Keyboard Demo Tool: Could not save keyboard layout preference');
            }
        } else if (event.data.type === 'requestTheme') {
            iframe.contentWindow.postMessage({ type: 'setTheme', theme: savedTheme }, '*');
        }
    }
    
    // Intelligent auto-scrolling to keep focused elements visible above keyboard
    var KEYBOARD_HEIGHT = 316;
    var SCROLL_PADDING = 20; // Extra padding above the keyboard
    
    function ensureFocusedElementVisible(element) {
        if (!element || element === document.body || element === document.documentElement) {
            return;
        }
        
        // Skip if element is inside our iframe
        if (element.closest && element.closest('#keyboard-visualizer-iframe')) {
            return;
        }
        
        var rect = element.getBoundingClientRect();
        var viewportHeight = window.innerHeight;
        var safeAreaBottom = viewportHeight - KEYBOARD_HEIGHT - SCROLL_PADDING;
        
        // Check if element's bottom is hidden behind the keyboard
        if (rect.bottom > safeAreaBottom) {
            // Calculate how much to scroll
            var scrollAmount = rect.bottom - safeAreaBottom;
            
            // Scroll smoothly
            window.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
        
        // Also check if element is above the visible area (scrolled too far down)
        var topPadding = 20;
        if (rect.top < topPadding) {
            window.scrollBy({
                top: rect.top - topPadding,
                behavior: 'smooth'
            });
        }
    }
    
    // Handle focus events to auto-scroll
    function handleFocusIn(e) {
        // Small delay to allow browser's default scroll behavior first
        setTimeout(function() {
            ensureFocusedElementVisible(e.target);
        }, 50);
    }
    
    // Attach event listeners (capture phase for priority)
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('message', handleParentMessages);
    document.addEventListener('focusin', handleFocusIn, true);
    
    console.log('Keyboard Demo Tool v' + VERSION + ' loaded successfully!');
    console.log('Close: ' + closeShortcutSimple + ' | Theme: ' + themeShortcutSimple);
    console.log('iframe architecture - complete CSS isolation');
})();