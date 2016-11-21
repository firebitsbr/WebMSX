// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

wmsx.ControllersHub = function(keyForwardControls) {
"use strict";

    this.connect = function(machineControlsSocket, controllersSocket, biosSocket) {
        controllersSocket.connectControls(this);
        keyboard.connect(biosSocket);
        mouseControls.connect(controllersSocket);
        touchControls.connect(machineControlsSocket);
    };

    this.connectPeripherals = function(pScreen) {
        screen = pScreen;
        keyboard.connectPeripherals(screen);
        mouseControls.connectPeripherals(screen);
        joystickControls.connectPeripherals(screen);
        joykeysControls.connectPeripherals(screen);
        touchControls.connectPeripherals(screen);
    };

    this.powerOn = function() {
        keyboard.powerOn();
        mouseControls.powerOn();
        joystickControls.powerOn();
        joykeysControls.powerOn();
        touchControls.powerOn();
    };

    this.powerOff = function() {
        keyboard.powerOff();
        mouseControls.powerOff();
        joystickControls.powerOff();
        joykeysControls.powerOff();
        touchControls.powerOff();
    };

    this.getKeyboard = function() {
        return keyboard;
    };

    this.getTouchControls = function() {
        return touchControls;
    };

    this.releaseControllers = function() {
        keyboard.releaseControllers();
        joystickControls.releaseControllers();
        joykeysControls.releaseControllers();
        mouseControls.releaseControllers();
        touchControls.releaseControllers();
    };

    this.resetControllers = function() {
        keyboard.resetControllers();
        joystickControls.resetControllers();
        joystickControls.resetControllers();
        mouseControls.resetControllers();
    };

    this.readKeyboardPort = function(row) {
        return keyboard.readKeyboardPort(row);
    };

    this.readControllerPort = function(port) {
        var forward = controllerAtPort[port];
        return (forward ? forward.readControllerPort(port) : 0x3f) | japanaseKeyboardLayoutPortValue;
    };

    this.writeControllerPin8Port = function(port, value) {
        mouseControls.portPin8Announced(port, value);       // Give Mouse a chance to Auto Enable
        var forward = controllerAtPort[port];
        if (forward) forward.writeControllerPin8Port(port, value);
    };

    this.controllersClockPulse = function() {
        keyboard.controllersClockPulse();
        joystickControls.controllersClockPulse();
        touchControls.controllersClockPulse();
    };

    this.toggleKeyboardLayout = function() {
        keyboard.toggleKeyboardLayout();
    };

    this.toggleJoystickMode = function() {
        joystickControls.toggleMode();
    };

    this.toggleJoykeysMode = function() {
        joykeysControls.toggleMode();
    };

    this.toggleMouseMode = function() {
        mouseControls.toggleMode();
    };

    this.toggleTouchControlsMode = function() {
        touchControls.toggleMode();
    };

    this.toggleTurboFireSpeed = function() {
        turboFireSpeed = (turboFireSpeed + 1) % 11;
        var turboClocks = turboFireSpeed ? (60 / turboFirePerSecond[turboFireSpeed]) | 0 : 0;
        keyboard.setTurboFireClocks(turboClocks);
        joystickControls.setTurboFireClocks(turboClocks);
        joykeysControls.setTurboFireClocks(turboClocks);
        touchControls.setTurboFireClocks(turboClocks);
        screen.showOSD("Turbo-Fire" + (turboFireSpeed ? " speed: " + turboFireSpeed : ": OFF"), true);
    };

    this.setupTouchControlsIfNeeded = function(mainElement) {
        touchControls.setupTouchControlsIfNeeded(mainElement)
    };

    this.setKeyInputElement = function(element) {
        element.addEventListener("keydown", this.keyDown);
        element.addEventListener("keyup", this.keyUp);
    };

    this.screenReadjustedUpdate = function() {
        touchControls.screenReadjustedUpdate();
    };

    this.keyDown = function(e) {
        return processKeyEvent(e, true);
    };

    this.keyUp = function(e) {
        return processKeyEvent(e, false);
    };

    this.setMouseInputElement = function(element) {
        mouseControls.setMouseInputElement(element);
    };

    this.setScreenPixelScale = function(scaleX, scaleY) {
        mouseControls.setScreenPixelScale(scaleX, scaleY);
    };

    this.updateMouseConnections = function(onPort0, onPort1) {
        mousePresent[0] = onPort0; mousePresent[1] = onPort1;
        updateConnections();
    };

    this.updateJoystickConnections = function(onPort0, onPort1) {
        joystickPresent[0] = onPort0; joystickPresent[1] = onPort1;
        updateConnections();
    };

    this.updateJoykeysConnections = function(onPort0, onPort1) {
        joykeysPresent[0] = onPort0; joykeysPresent[1] = onPort1;
        updateConnections();
    };

    this.updateTouchControlsConnections = function(onPort0, onPort1) {
        touchPresent[0] = onPort0; touchPresent[1] = onPort1;
        updateConnections();
    };

    this.showStatusMessage = function(prefix) {
        var p1 = mousePresent[0] || joystickPresent[0] || joykeysPresent[0] || touchPresent[0] || "&nbsp-&nbsp-&nbsp&nbsp";
        var p2 = mousePresent[1] || joystickPresent[1] || joykeysPresent[1] || touchPresent[1] || "&nbsp-&nbsp-&nbsp&nbsp";
        screen.showOSD((prefix ? prefix + ".&nbsp&nbsp" : "" ) + "Port 1:&nbsp&nbsp" + p1 + ",&nbsp&nbspPort 2:&nbsp&nbsp" + p2, true);
    };

    this.showErrorMessage = function(message) {
        screen.showOSD(message, true, true);
    };

    this.getSettingsState = function() {
        settingsStateRet.mouseModeDesc = mouseControls.getModeDesc();
        settingsStateRet.joysticksModeDesc = joystickControls.getModeDesc();
        settingsStateRet.joykeysModeDesc = joykeysControls.getModeDesc();
        settingsStateRet.touchPortSet = touchControls.getPortActive();
        settingsStateRet.touchActive = controllerAtPort[0] === touchControls || controllerAtPort[1] === touchControls;
        settingsStateRet.ports[0] = mousePresent[0] || joystickPresent[0] || joykeysPresent[0] || touchPresent[0] || wmsx.ControllersHub.NONE;
        settingsStateRet.ports[1] = mousePresent[1] || joystickPresent[1] || joykeysPresent[1] || touchPresent[1] || wmsx.ControllersHub.NONE;
        return settingsStateRet;
    };

    this.getMappingForControl = function(button, port) {
        return controllerAtPort[port] && controllerAtPort[port].getMappingForControl(button, port);
    };

    this.getMappingPopupText = function(button, port) {
        return controllerAtPort[port] && controllerAtPort[port].getMappingPopupText(button, port);
    };

    this.mappingPopupVisibility = function(popup, port, visible) {
        // Start listening for joystick button presses if needed
        if (visible && controllerAtPort[port] === joystickControls)
            joystickControls.startButtonDetection(port, popup);
        else
            joystickControls.stopButtonDetection();
    };

    this.customizeControl = function(button, port, mapping) {
        controllerAtPort[port].customizeControl(button, port, mapping);
    };

    this.clearControl = function(button, port) {
        return controllerAtPort[port].clearControl(button, port);
    };

    var processKeyEvent = function(e, press) {
        e.returnValue = false;  // IE
        e.preventDefault();
        e.stopPropagation();

        var code = wmsx.DOMKeys.codeForKeyboardEvent(e);
        joykeysControls.processKey(code, press);

        return false;
    };

    function updateConnections() {
        // Mouse takes precedence, then Joysticks, then Joykeys, then Touch
        for (var p = 0; p <= 1; ++p) {
            if (mousePresent[p])
                controllerAtPort[p] = mouseControls;
            else if (joystickPresent[p])
                controllerAtPort[p] = joystickControls;
            else if (joykeysPresent[p])
                controllerAtPort[p] = joykeysControls;
            else if (touchPresent[p])
                controllerAtPort[p] = touchControls;
            else
                controllerAtPort[p] = null;
        }
        touchControls.controllersSettingsStateUpdate();
        screen.controllersSettingsStateUpdate();
    }


    var controllerAtPort = [ null, null ];

    var mousePresent =     [ null, null ];
    var joystickPresent =  [ null, null ];
    var joykeysPresent =   [ null, null ];
    var touchPresent =     [ null, null ];
    var settingsStateRet = { ports: [ null, null ]};

    var keyboard =         new wmsx.DOMKeyboard(this, keyForwardControls);
    var mouseControls =    new wmsx.DOMMouseControls(this);
    var joystickControls = new wmsx.GamepadJoysticksControls(this, keyboard);
    var joykeysControls =  new wmsx.DOMJoykeysControls(this, keyboard);
    var touchControls =    new wmsx.DOMTouchControls(this, keyboard);

    var turboFireSpeed = 0;
    var turboFirePerSecond = [ 0, 2, 2.4, 3, 4, 5, 6, 7.5, 10, 12, 15 ];

    var japanaseKeyboardLayoutPortValue = WMSX.KEYBOARD_JAPAN_LAYOUT !== 0 ? 0x40 : 0;

    var screen;


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
            t: touchControls.saveState()
        };
    };

    this.loadState = function(s) {
        touchControls.loadState(s.t);
    };

};


wmsx.ControllersHub.MOUSE =    "MOUSE";
wmsx.ControllersHub.JOYSTICK = "JOYSTICK";
wmsx.ControllersHub.JOYKEYS =  "JOYKEYS";
wmsx.ControllersHub.TOUCH =    "TOUCH";
wmsx.ControllersHub.JOY_ANY =  "JOY";
wmsx.ControllersHub.NONE =     "NO DEVICE";