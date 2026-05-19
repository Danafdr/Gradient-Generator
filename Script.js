document.addEventListener("DOMContentLoaded", function () {
    // ── Elements ──
    const colorPickers   = document.querySelectorAll(".color-box input[type='text']");
    const colorPickerInputs = document.querySelectorAll(".color-picker-input");
    const lockBtns       = document.querySelectorAll(".lock-btn");
    const copyColorBtns  = document.querySelectorAll(".copy-color-btn");
    const gradientSlider = document.getElementById("gradient-slider");
    const rotationInput  = document.getElementById("rotation-input");
    const flipHBtn       = document.getElementById("flip-horizontal");
    const flipVBtn       = document.getElementById("flip-vertical");
    const generateBtn    = document.getElementById("generate-btn");
    const hideUiBtn      = document.getElementById("hide-ui");
    const container      = document.querySelector(".container");
    const copyNotif      = document.getElementById("copy-notification");
    const copyNotifText  = document.getElementById("copy-notification-text");
    const watermark      = document.querySelector(".watermark");
    const helpIcon       = document.getElementById("help-icon");
    const helpPopup      = document.getElementById("help-popup");
    const helpOverlay    = document.getElementById("help-overlay");
    const closeHelpBtn   = document.getElementById("close-help");
    const helpTabs       = document.querySelectorAll(".help-tab");
    const tabPanels      = document.querySelectorAll(".tab-panel");
    const tabIndicator   = document.querySelector(".tab-indicator");
    const bgGlow         = document.getElementById("background-glow");
    const sliderRatio    = document.getElementById("slider-ratio");

    // ── State ──
    let colors  = ["#132663", "#FF0000"];
    let angle   = 45;
    let balance = 50;
    let isDragging = false, startX = 0, startValue = 0, startAngle = 0;

    function getHexLuminance(hex) {
        if (!hex || hex.length !== 7) return 0;
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // ── Gradient ──
    function updateGradient() {
        const bgGrad = `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[0]} ${balance * 0.6}%, ${colors[1]} ${100 - (100 - balance) * 0.6}%, ${colors[1]} 100%)`;
        document.body.style.background = bgGrad;
        gradientSlider.style.background = `linear-gradient(to right, ${colors[0]} 0%, ${colors[0]} ${balance * 0.6}%, ${colors[1]} ${100 - (100 - balance) * 0.6}%, ${colors[1]} 100%)`;

        if (sliderRatio) {
            sliderRatio.textContent = `${balance}/${100 - balance}`;
        }

        // Always stay dark — no light-theme toggling
        document.body.classList.remove("light-theme");

        // Radial glow void fallback
        if (bgGlow) {
            const lum0 = getHexLuminance(colors[0]);
            const lum1 = getHexLuminance(colors[1]);
            const avgLum = (lum0 * (100 - balance) + lum1 * balance) / 100;
            if (avgLum < 15) {
                bgGlow.style.background = "rgba(30, 35, 45, 0.6)";
            } else {
                bgGlow.style.background = bgGrad;
            }
        }
    }

    function updateRotationValue() { rotationInput.value = angle.toString(); }

    // ── Copy to clipboard ──
    let notifTimer = null;
    function showCopyNotification(sub) {
        const subEl = document.getElementById("copy-notification-text");
        if (subEl) subEl.textContent = sub || "Copied to clipboard";
        copyNotif.classList.add("show");
        clearTimeout(notifTimer);
        notifTimer = setTimeout(() => copyNotif.classList.remove("show"), 2200);
    }

    async function copyText(str) {
        try {
            await navigator.clipboard.writeText(str);
        } catch {
            // fallback
            const ta = document.createElement("textarea");
            ta.value = str; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select(); document.execCommand("copy");
            document.body.removeChild(ta);
        }
    }

    // ── Color inputs (text) ──
    colorPickers.forEach((picker, i) => {
        picker.addEventListener("click", () => { picker.removeAttribute("readonly"); picker.focus(); });
        picker.addEventListener("blur",  () => picker.setAttribute("readonly", true));

        picker.addEventListener("input", () => {
            let v = picker.value;
            if (!v.startsWith("#")) v = "#" + v;
            if (v.length > 7) v = v.slice(0, 7);
            picker.value = v;
            colors[i] = v;
            document.getElementById(`color-preview${i+1}`).style.backgroundColor = v;
            updateGradient();
        });

        picker.addEventListener("dblclick", () => {
            picker.select();
            copyText(colors[i]);
            showCopyNotification(`${colors[i].toUpperCase()} copied!`);
        });

        picker.addEventListener("keydown", e => {
            if (e.key === "Backspace" && picker.value.length <= 1) e.preventDefault();
        });
    });

    // ── Color pickers (native) ──
    colorPickerInputs.forEach((inp, i) => {
        inp.addEventListener("input", () => {
            const v = inp.value;
            colors[i] = v;
            document.getElementById(`color-preview${i+1}`).style.backgroundColor = v;
            document.getElementById(`color${i+1}`).value = v;
            updateGradient();
        });
    });

    // ── Copy buttons ──
    copyColorBtns.forEach((btn, i) => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            copyText(colors[i]);
            showCopyNotification(`${colors[i].toUpperCase()} copied!`);
        });
    });

    // ── Lock buttons (CSS-driven icons) ──
    lockBtns.forEach(btn => {
        btn.addEventListener("click", () => btn.classList.toggle("locked"));
    });

    // ── Slider ──
    gradientSlider.addEventListener("input", function () {
        const v = parseInt(this.value);
        if (isNaN(v)) return; // guard against broken value
        balance = Math.min(100, Math.max(0, v));
        updateGradient();
    });
    // Blur slider when released so spacebar doesn't get consumed by it
    gradientSlider.addEventListener("pointerup", () => gradientSlider.blur());
    gradientSlider.addEventListener("mouseup",   () => gradientSlider.blur());
    gradientSlider.addEventListener("touchend",  () => gradientSlider.blur());

    // ── Rotation input (drag) ──
    rotationInput.addEventListener("input", () => {
        let v = parseInt(rotationInput.value);
        if (isNaN(v) || v < 0) v = 0;
        else if (v > 360) v = 360;
        angle = v; rotationInput.value = angle;
        updateGradient();
    });
    rotationInput.addEventListener("blur", () => {
        if (rotationInput.value === "") { angle = 0; rotationInput.value = 0; updateGradient(); }
    });
    rotationInput.addEventListener("mousedown", e => {
        isDragging = true; startX = e.clientX; startValue = parseInt(rotationInput.value);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });
    function onMouseMove(e) {
        if (!isDragging) return;
        const delta = e.clientX - startX;
        angle = Math.round((startValue + delta) % 360);
        if (angle < 0) angle += 360;
        rotationInput.value = angle; updateGradient(); updateRotationValue();
    }
    function onMouseUp() {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    // ── Flip ──
    flipHBtn.addEventListener("click", () => { [colors[0], colors[1]] = [colors[1], colors[0]]; updateGradient(); syncColorInputs(); });
    flipVBtn.addEventListener("click", () => { angle = (angle + 180) % 360; updateGradient(); updateRotationValue(); });

    function syncColorInputs() {
        colorPickers.forEach((p, i) => {
            p.value = colors[i];
            document.getElementById(`color-preview${i+1}`).style.backgroundColor = colors[i];
            colorPickerInputs[i].value = colors[i];
        });
    }

    // ── Generate & History ──
    const history = [];
    const undoBtn = document.getElementById("undo-btn");

    function saveToHistory() {
        // Save a deep copy of the current state before we overwrite it
        history.push({ colors: [...colors], balance, angle });
        if (history.length > 50) history.shift(); // Keep max 50 states
        if (undoBtn) undoBtn.disabled = false;
    }

    if (undoBtn) {
        undoBtn.addEventListener("click", () => {
            if (history.length === 0) return;
            const prevState = history.pop();
            colors = prevState.colors;
            balance = prevState.balance;
            angle = prevState.angle;
            
            // Sync all UI elements
            gradientSlider.value = balance;
            syncColorInputs();
            updateRotationValue();
            updateGradient();
            
            // Disable if history is empty
            undoBtn.disabled = history.length === 0;
        });
    }

    function generateColors() {
        // Save current state to history BEFORE generating new colors
        saveToHistory();

        colors = colors.map((c, i) =>
            lockBtns[i].classList.contains("locked") ? c
            : "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
        );
        // Reset balance to 50/50
        balance = 50;
        gradientSlider.value = 50;
        syncColorInputs();
        updateGradient();
        // Blur any focused element so spacebar works immediately again
        if (document.activeElement) document.activeElement.blur();
    }
    generateBtn.addEventListener("click", generateColors);

    // ── Copy CSS Gradient ──
    const copyCssBtn = document.getElementById("copy-css-btn");
    if (copyCssBtn) {
        copyCssBtn.addEventListener("click", () => {
            const css = `linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]})`;
            copyText(`background: ${css};`);
            showCopyNotification(css);
        });
    }

    // ── Spacebar → generate ──
    document.addEventListener("keydown", e => {
        const tag = document.activeElement.tagName;
        // Don't fire when typing in an input
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.code === "Space") { e.preventDefault(); generateColors(); }
        if (e.key === "Escape" && helpPopup.classList.contains("show")) closeHelp();
    });

    // ── Hide UI ──
    hideUiBtn.addEventListener("click", e => {
        e.stopPropagation();
        container.classList.toggle("hidden");
        hideUiBtn.textContent = container.classList.contains("hidden") ? "Show UI" : "Hide UI";
    });
    document.addEventListener("click", () => {
        if (container.classList.contains("hidden")) {
            container.classList.remove("hidden");
            hideUiBtn.textContent = "Hide UI";
        }
    });
    // ── Help ──
    const tabPanelsContainer = document.querySelector(".tab-panels");

    function updateTabHeight(panel) {
        if (panel && tabPanelsContainer) {
            tabPanelsContainer.style.height = panel.scrollHeight + "px";
        }
    }

    function openHelp() {
        helpPopup.classList.add("show");
        helpOverlay.classList.add("show");
        
        const activePanel = document.querySelector(".tab-panel.active");
        if (activePanel) updateTabHeight(activePanel);
    }

    function closeHelp() {
        helpPopup.classList.remove("show");
        helpOverlay.classList.remove("show");
    }

    helpIcon.addEventListener("click", openHelp);
    closeHelpBtn.addEventListener("click", closeHelp);
    helpOverlay.addEventListener("click", closeHelp);

    // ── Tabs (Guide / About) ──
    let currentTab = "guide";

    helpTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;
            if (target === currentTab) return;

            const tabsArr = Array.from(helpTabs);
            const currentIndex = tabsArr.findIndex(t => t.dataset.tab === currentTab);
            const targetIndex = tabsArr.findIndex(t => t.dataset.tab === target);
            const goingRight = targetIndex > currentIndex;

            helpTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            // Dynamic indicator positioning
            tabIndicator.style.width = tab.offsetWidth + "px";
            tabIndicator.style.transform = `translateX(${tab.offsetLeft - 3}px)`;

            const outPanel = document.getElementById(`panel-${currentTab}`);
            const inPanel  = document.getElementById(`panel-${target}`);

            // Animate old panel out
            if (outPanel) {
                outPanel.classList.remove("active");
                // Clear old directions
                outPanel.classList.remove("to-left", "to-right", "from-left", "from-right");
                // Send it to the opposite side of where we're going
                outPanel.classList.add(goingRight ? "to-left" : "to-right");
            }

            // Animate new panel in
            if (inPanel) {
                // Clear old directions
                inPanel.classList.remove("to-left", "to-right", "from-left", "from-right");
                // Set where it starts from
                inPanel.classList.add(goingRight ? "from-right" : "from-left");
                void inPanel.offsetWidth; // Force layout to register starting position
                
                // Activate it (removes from- direction so it slides to 0)
                inPanel.classList.add("active");
                inPanel.classList.remove("from-right", "from-left");
                
                // Update the window height to match the new panel
                updateTabHeight(inPanel);
            }

            currentTab = target;
        });
    });

    // ── Init ──
    updateGradient();
    updateRotationValue();
    updateRotarySwitch();
    window.addEventListener("resize", updateGradient);
});