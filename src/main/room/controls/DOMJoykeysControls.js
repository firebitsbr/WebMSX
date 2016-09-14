// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.DOMJoykeysControls = function(hub, keyForwardControls) {
"use strict";

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        applyPreferences();
    };

    this.powerOff = function() {
    };

    this.releaseControllers = function() {
        resetStates();
    };

    this.resetControllers = function() {
        this.releaseControllers();
        updateConnectionsToHub();
    };

    this.readControllerPort = function(port) {
        return joyStates[port ^ swappedMode].portValue;
    };

    this.writeControllerPin8Port = function(atPort, val) {
        // Do nothing
    };

    this.toggleMode = function() {
        ++mode; if (mode > 3) mode = -1;

        swappedMode = mode === 1 || mode === 3;
        resetStates();
        updateConnectionsToHub();
        updateCodeMap();

        hub.showStatusMessage("Joykeys " + this.getModeDesc());
    };

    this.getModeDesc = function() {
        return mode === -1 ? "DISABLED" : (mode < 2 ? "ONE" : "BOTH") + (swappedMode ? " (swapped)" : "");
    };

    this.setTurboFireSpeed = function(speed) {
        turboFireSpeed = speed ? speed * speed + 3 : 0;
        turboFireFlipClockCount = 0;
    };

    this.processKey = function(code, press) {
        if (mode < 0) return keyForwardControls.processKey(code, press);

        var mappings = keyCodeMap[code];
        if (!mappings) return keyForwardControls.processKey(code, press);

        for (var i = 0; i < mappings.length; ++i) {
            if (press) joyStates[mappings[i].p].portValue &= ~(1 << joystickButtons[mappings[i].b]);
            else       joyStates[mappings[i].p].portValue |= (1 << joystickButtons[mappings[i].b]);
        }
    };

    this.getMappingForControl = function(button, port) {
        return joyPrefs[port ^ swappedMode].buttons[button];
    };

    this.getMappingPopupText = function(button, port) {
        return { heading: "Button mapped to:", footer: "Press new key.<br>(right-click to clear)" };
    };

    this.customizeControl = function (button, port, mapping) {
        // Ignore if key is already mapped
        if (keyCodeMap[mapping.c] && wmsx.Util.arrayFind(keyCodeMap[mapping.c], function(map) {
                return map.b === button && map.p === port;
            })) return;

        // Add new mapping, max of X keys
        var mappings = joyPrefs[port ^ swappedMode].buttons[button];
        if (mappings.length >= MAX_KEYS_MAPPED) mappings.splice(0, mappings.length - (MAX_KEYS_MAPPED - 1));
        mappings.push(mapping);

        resetStates();
        updateCodeMap();
    };

    this.clearControl = function(button, port) {
        joyPrefs[port ^ swappedMode].buttons[button].length = 0;
        resetStates();
        updateCodeMap();
    };

    function updateCodeMap() {
        keyCodeMap = {};
        if (mode >= 0) updateCodeMapJoykeys(joy1Prefs.buttons, 0);
        if (mode >= 2) updateCodeMapJoykeys(joy2Prefs.buttons, 1);
    }

    function updateCodeMapJoykeys(mappings, port) {
        for (var b in mappings) {
            for (var i = 0; i < mappings[b].length; ++i) {
                if (!keyCodeMap[mappings[b][i].c]) keyCodeMap[mappings[b][i].c] = [];
                keyCodeMap[mappings[b][i].c].push({ b: b, p: port });
            }
        }
    }

    function updateConnectionsToHub() {
        var j1 = mode >= 0 ? wmsx.ControllersHub.JOYKEYS + " 1" : null;
        var j2 = mode >= 2 ? wmsx.ControllersHub.JOYKEYS + " 2" : null;

        hub.updateJoykeysConnections(swappedMode ? j2 : j1, swappedMode ? j1 : j2);
    }

    function resetStates() {
        joy1State.reset();
        joy2State.reset();
    }

    function applyPreferences() {
        joyPrefs[0] = joy1Prefs = WMSX.userPreferences.joykeys[0];
        joyPrefs[1] = joy2Prefs = WMSX.userPreferences.joykeys[1];
    }


    var joystickButtons = wmsx.JoystickButtons;

    var machineControlsSocket;
    var screen;

    var mode = -1;
    var swappedMode = false;

    var keyCodeMap = {};

    var turboFireSpeed = 0, turboFireFlipClockCount = 0;

    var joy1State = new JoystickState();
    var joy2State = new JoystickState();
    var joyStates = [ joy1State, joy2State ];

    var joy1Prefs;
    var joy2Prefs;
    var joyPrefs = [];

    var MAX_KEYS_MAPPED = 4;

    function JoystickState() {
        this.reset = function() {
            this.buttonsState = {};         // All buttons released
            this.portValue = 0x3f;          // All switches off
        };
        this.reset();
    }

};
