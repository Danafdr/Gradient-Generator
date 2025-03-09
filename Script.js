document.addEventListener("DOMContentLoaded", function () {
    const colorPickers = document.querySelectorAll(".color-box input[type='text']");
    const colorPickerInputs = document.querySelectorAll(".color-picker-input");
    const lockBtns = document.querySelectorAll(".lock-btn");
    const gradientSlider = document.getElementById("gradient-slider");
    const rotationInput = document.getElementById("rotation-input");
    const rotarySwitch = document.getElementById("rotary-switch");
    const rotaryIndicator = document.getElementById("rotary-indicator");
    const flipHorizontalBtn = document.getElementById("flip-horizontal");
    const flipVerticalBtn = document.getElementById("flip-vertical");
    const generateBtn = document.getElementById("generate-btn");
    const hideUiBtn = document.getElementById("hide-ui");
    const container = document.querySelector(".container");
    const leftPercentage = document.getElementById("left-percentage");
    const rightPercentage = document.getElementById("right-percentage");
    const copyNotification = document.getElementById("copy-notification");
    const watermark = document.querySelector(".watermark");
    const helpIcon = document.getElementById("help-icon");
    const helpPopup = document.getElementById("help-popup");
    const closeHelpBtn = document.getElementById("close-help");

    let colors = ["#132663", "#FF0000"];
    let angle = 45;
    let balance = 50; // Default balance at center
    let isDragging = false;
    let startX = 0;
    let startValue = 0;

    function updateGradient() {
        document.body.style.background = `linear-gradient(${angle}deg, ${colors[0]} ${balance}%, ${colors[1]} 100%)`;
        gradientSlider.style.background = `linear-gradient(to right, ${colors[0]} ${balance}%, ${colors[1]} ${balance}%)`;
        leftPercentage.textContent = `${balance}%`;
        rightPercentage.textContent = `${100 - balance}%`;
        updateWatermarkColor();
    }

    function updateRotationValue() {
        rotationInput.value = angle.toString(); // Ensure no commas
    }

    function updateWatermarkColor() {
        const bgColor = getComputedStyle(document.body).backgroundColor;
        const rgb = bgColor.match(/\d+/g);
        const brightness = Math.round(((parseInt(rgb[0]) * 299) +
                                      (parseInt(rgb[1]) * 587) +
                                      (parseInt(rgb[2]) * 114)) / 1000);
        const color = (brightness > 125) ? 'black' : 'white';
        watermark.style.color = color;
        watermark.querySelector('a').style.color = color;
    }

    colorPickers.forEach((picker, index) => {
        picker.addEventListener("click", function () {
            picker.removeAttribute("readonly");
            picker.focus();
        });

        picker.addEventListener("blur", function () {
            picker.setAttribute("readonly", true);
        });

        picker.addEventListener("input", function () {
            let value = picker.value;
            if (!value.startsWith("#")) {
                value = "#" + value;
            }
            if (value.length > 7) {
                value = value.slice(0, 7);
            }
            picker.value = value;
            colors[index] = value;
            document.getElementById(`color-preview${index + 1}`).style.backgroundColor = value;
            updateGradient();
        });

        picker.addEventListener("dblclick", function () {
            picker.select();
            document.execCommand("copy");
            showCopyNotification();
        });

        picker.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && picker.value.length <= 1) {
                e.preventDefault();
            }
        });

        picker.addEventListener("input", function (e) {
            if (picker.value.length > 7) {
                picker.value = picker.value.slice(0, 7);
            }
            if (!picker.value.startsWith("#")) {
                picker.value = "#" + picker.value;
            }
        });
    });

    colorPickerInputs.forEach((pickerInput, index) => {
        pickerInput.addEventListener("click", function () {
            pickerInput.click();
        });

        pickerInput.addEventListener("input", function () {
            let value = pickerInput.value;
            if (!value.startsWith("#")) {
                value = "#" + value;
            }
            if (value.length > 7) {
                value = value.slice(0, 7);
            }
            pickerInput.value = value;
            colors[index] = value;
            document.getElementById(`color-preview${index + 1}`).style.backgroundColor = value;
            document.getElementById(`color${index + 1}`).value = value;
            updateGradient();
        });
    });

    lockBtns.forEach((btn, index) => {
        btn.addEventListener("click", function () {
            btn.classList.toggle("locked");
            if (btn.classList.contains("locked")) {
                btn.textContent = "🔒";
            } else {
                btn.textContent = "🔓";
            }
        });
    });

    gradientSlider.addEventListener("input", function () {
        balance = this.value;
        updateGradient();
    });

    rotationInput.addEventListener("input", function () {
        let value = parseInt(rotationInput.value);
        if (isNaN(value) || value < 0) {
            value = 0;
        } else if (value > 360) {
            value = 360;
        }
        angle = value;
        rotationInput.value = angle;
        updateGradient();
        updateRotarySwitch();
    });

    rotationInput.addEventListener("blur", function () {
        if (rotationInput.value === "") {
            rotationInput.value = 0;
            angle = 0;
            updateGradient();
            updateRotarySwitch();
        }
    });

    rotationInput.addEventListener("mousedown", function (e) {
        isDragging = true;
        startX = e.clientX;
        startValue = parseInt(rotationInput.value);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });

    function onMouseMove(e) {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            angle = Math.round((startValue + deltaX) % 360);
            if (angle < 0) angle += 360;
            rotationInput.value = angle;
            updateGradient();
            updateRotarySwitch();
            updateRotationValue();
        }
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    }

    rotarySwitch.addEventListener("mousedown", function (e) {
        isDragging = true;
        startX = e.clientX;
        startAngle = getAngle(e.clientX, e.clientY);
        document.addEventListener("mousemove", onMouseMoveRotary);
        document.addEventListener("mouseup", onMouseUpRotary);
    });

    function onMouseMoveRotary(e) {
        if (isDragging) {
            const currentAngle = getAngle(e.clientX, e.clientY);
            const deltaAngle = currentAngle - startAngle;
            angle = Math.round((angle + deltaAngle) % 360);
            if (angle < 0) angle += 360;
            startAngle = currentAngle;
            updateGradient();
            updateRotarySwitch();
            updateRotationValue();
        }
    }

    function onMouseUpRotary() {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMoveRotary);
        document.removeEventListener("mouseup", onMouseUpRotary);
    }

    function getAngle(x, y) {
        const rect = rotarySwitch.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = x - centerX;
        const dy = y - centerY;
        return Math.atan2(dy, dx) * (180 / Math.PI);
    }

    flipHorizontalBtn.addEventListener("click", function () {
        [colors[0], colors[1]] = [colors[1], colors[0]];
        updateGradient();
    });

    flipVerticalBtn.addEventListener("click", function () {
        angle = (angle + 180) % 360;
        updateGradient();
        updateRotarySwitch();
    });

    generateBtn.addEventListener("click", function () {
        colors = colors.map((color, index) => {
            return lockBtns[index].classList.contains("locked") ? color : `#${Math.floor(Math.random() * 16777215).toString(16)}`;
        });
        colorPickers.forEach((picker, index) => {
            picker.value = colors[index];
            document.getElementById(`color-preview${index + 1}`).style.backgroundColor = colors[index];
        });
        updateGradient();
    });

    hideUiBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        container.classList.toggle("hidden");
        hideUiBtn.textContent = container.classList.contains("hidden") ? "Show UI" : "Hide UI";
    });

    document.addEventListener("click", function () {
        if (container.classList.contains("hidden")) {
            container.classList.remove("hidden");
            hideUiBtn.textContent = "Hide UI";
        }
    });

    function showCopyNotification() {
        copyNotification.classList.add("show");
        setTimeout(() => {
            copyNotification.classList.remove("show");
        }, 2000);
    }

    function updateRotarySwitch() {
        rotaryIndicator.style.transition = 'none'; // Remove ease transition
        rotaryIndicator.style.transform = `rotate(${angle}deg)`;
    }

    helpIcon.addEventListener("click", function () {
        helpPopup.classList.add("show");
    });

    document.querySelector('.close-btn').addEventListener('click', function() {
    const helpPopup = document.querySelector('.help-popup');
    helpPopup.classList.add('hide');
    setTimeout(() => {
        helpPopup.classList.remove('show');
        helpPopup.classList.remove('hide');
    }, 300); // Match the duration of the fadeOut animation
});

    updateGradient();
    updateRotationValue();
    updateRotarySwitch();
});