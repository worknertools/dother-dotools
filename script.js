// DOM Elements
const imageLoader = document.getElementById('imageLoader');
const sourceCanvas = document.getElementById('sourceCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const downloadPngBtn = document.getElementById('downloadPngBtn');
const downloadSvgBtn = document.getElementById('downloadSvgBtn');
const controlsPanel = document.getElementById('controls-panel');
const presetsPanel = document.getElementById('presets-panel');
const placeholder = document.getElementById('placeholder');
const fileNameEl = document.getElementById('fileName');

const resolutionSlider = document.getElementById('resolution');
const spacingSlider = document.getElementById('spacing');
const dotSizeSlider = document.getElementById('dotSize');
const shuffleSlider = document.getElementById('shuffle');
const grainSlider = document.getElementById('grain');
const zoomSlider = document.getElementById('zoom');
const mixedShapesToggle = document.getElementById('mixedShapesToggle');
const polygonsToggle = document.getElementById('polygonsToggle');
const uniformToggle = document.getElementById('uniformToggle');
const rotationSlider = document.getElementById('rotation');
const animationStyleSelect = document.getElementById('animationStyle');
const bgBlurSlider = document.getElementById('bgBlur');
const bgOpacitySlider = document.getElementById('bgOpacity');
const autoColorToggle = document.getElementById('autoColorToggle');
const manualColorPicker = document.getElementById('manualColorPicker');
const manualColorInput = document.getElementById('manualColorInput');
const manualColorControls = document.getElementById('manualColorControls');
const limitPaletteToggle = document.getElementById('limitPaletteToggle');
const paletteSizeSlider = document.getElementById('paletteSize');
const paletteSizeValue = document.getElementById('paletteSizeValue');
const paletteSizeContainer = document.getElementById('paletteSizeContainer');

const resolutionValue = document.getElementById('resolutionValue');
const spacingValue = document.getElementById('spacingValue');
const dotSizeValue = document.getElementById('dotSizeValue');
const shuffleValue = document.getElementById('shuffleValue');
const grainValue = document.getElementById('grainValue');
const zoomValue = document.getElementById('zoomValue');
const rotationValue = document.getElementById('rotationValue');
const bgBlurValue = document.getElementById('bgBlurValue');
const bgOpacityValue = document.getElementById('bgOpacityValue');

// Preset Elements
const presetsList = document.getElementById('presetsList');
const savePresetBtn = document.getElementById('savePresetBtn');
const loadPresetBtn = document.getElementById('loadPresetBtn');
const deletePresetBtn = document.getElementById('deletePresetBtn');

// Contexts
const sourceCtx = sourceCanvas.getContext('2d');
const previewCtx = previewCanvas.getContext('2d', { willReadFrequently: true });

// State
let sourceImage = new Image();
let imageData = null;
const CLASSIC_SHAPES = ['circle', 'square', 'triangle'];
const POLYGON_SHAPES = ['circle', 'hexagon', 'heptagon', 'decagon'];
let animationFrameId = null;
let dots = [];
let dominantColor = '#1B1D21';
let limitedPalette = [];
const PRESET_STORAGE_KEY = 'dotherEffectPresets';
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };

// --- Event Listeners ---

imageLoader.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    fileNameEl.textContent = file.name;
    const reader = new FileReader();
    reader.onload = event => {
        sourceImage.onload = () => {
            controlsPanel.classList.remove('opacity-50', 'pointer-events-none');
            presetsPanel.classList.remove('opacity-50', 'pointer-events-none');
            placeholder.style.display = 'none';
            previewCanvas.style.display = 'block';
            processImage();
        };
        sourceImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

let debounceTimeout;
function handleControlChange() {
     clearTimeout(debounceTimeout);
     debounceTimeout = setTimeout(() => {
        if (imageData) render();
     }, 10);
}

resolutionSlider.addEventListener('input', () => { resolutionValue.textContent = resolutionSlider.value; handleControlChange(); });
spacingSlider.addEventListener('input', () => { spacingValue.textContent = parseFloat(spacingSlider.value).toFixed(1); handleControlChange(); });
dotSizeSlider.addEventListener('input', () => { dotSizeValue.textContent = parseFloat(dotSizeSlider.value).toFixed(1); handleControlChange(); });
shuffleSlider.addEventListener('input', () => { shuffleValue.textContent = shuffleSlider.value; handleControlChange(); });
grainSlider.addEventListener('input', () => { grainValue.textContent = grainSlider.value; handleControlChange(); });
zoomSlider.addEventListener('input', () => { zoomValue.textContent = parseFloat(zoomSlider.value).toFixed(1); render(); });
rotationSlider.addEventListener('input', () => { rotationValue.textContent = rotationSlider.value; handleControlChange(); });
bgBlurSlider.addEventListener('input', () => { bgBlurValue.textContent = bgBlurSlider.value; handleControlChange(); });
bgOpacitySlider.addEventListener('input', () => { bgOpacityValue.textContent = parseFloat(bgOpacitySlider.value).toFixed(2); handleControlChange(); });
mixedShapesToggle.addEventListener('change', handleControlChange);
polygonsToggle.addEventListener('change', handleControlChange);
uniformToggle.addEventListener('change', () => {
    updateControlStates();
    handleControlChange();
});
animationStyleSelect.addEventListener('change', handleControlChange);
limitPaletteToggle.addEventListener('change', () => {
    updateControlStates();
    handleControlChange();
});
paletteSizeSlider.addEventListener('input', () => { 
    paletteSizeValue.textContent = paletteSizeSlider.value;
    generateLimitedPalette(imageData, parseInt(paletteSizeSlider.value));
    handleControlChange();
});


autoColorToggle.addEventListener('change', () => {
    if (autoColorToggle.checked) {
        manualColorControls.classList.add('opacity-50', 'pointer-events-none');
    } else {
        manualColorControls.classList.remove('opacity-50', 'pointer-events-none');
    }
    handleControlChange();
});

manualColorPicker.addEventListener('input', () => {
    manualColorInput.value = manualColorPicker.value;
    handleControlChange();
});

manualColorInput.addEventListener('input', () => {
    manualColorPicker.value = manualColorInput.value;
    handleControlChange();
});

window.addEventListener('resize', () => { if (imageData) processImage(); });

// Pan and Zoom Listeners
previewCanvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    panStart.x = e.clientX - panOffset.x;
    panStart.y = e.clientY - panOffset.y;
});
previewCanvas.addEventListener('mouseup', () => {
    isPanning = false;
});
previewCanvas.addEventListener('mouseleave', () => {
    isPanning = false;
});
previewCanvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        panOffset.x = e.clientX - panStart.x;
        panOffset.y = e.clientY - panStart.y;
        render();
    }
});

// Preset Listeners
savePresetBtn.addEventListener('click', savePreset);
loadPresetBtn.addEventListener('click', loadSelectedPreset);
deletePresetBtn.addEventListener('click', deleteSelectedPreset);

downloadPngBtn.addEventListener('click', () => {
    if (!imageData) return;
    const wasAnimating = animationStyleSelect.value !== 'none';
    if (wasAnimating) stopAnimation();
    
    // Temporarily render at 1x zoom for export
    const currentZoom = zoomSlider.value;
    const currentPan = { ...panOffset };
    zoomSlider.value = 1;
    panOffset = { x: 0, y: 0 };
    drawStatic();

    const dataUrl = previewCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'dotter-ditter.png';
    link.href = dataUrl;
    link.click();

    // Restore user's view
    zoomSlider.value = currentZoom;
    panOffset = currentPan;
    if (wasAnimating) render(); else drawStatic();
});

downloadSvgBtn.addEventListener('click', () => {
    if (!imageData) return;
    const svgString = generateSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'dotter-ditter.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
});

// --- UI State Functions ---
function updateControlStates() {
    const isUniform = uniformToggle.checked;
    const isLimited = limitPaletteToggle.checked;
    const shuffleContainer = document.getElementById('shuffleContainer');

    if (isUniform) {
        shuffleContainer.classList.add('opacity-50', 'pointer-events-none');
    } else {
        shuffleContainer.classList.remove('opacity-50', 'pointer-events-none');
    }
    if (isLimited) {
        paletteSizeContainer.classList.remove('opacity-50', 'pointer-events-none');
    } else {
        paletteSizeContainer.classList.add('opacity-50', 'pointer-events-none');
    }
}


// --- Preset Functions ---

function getPresets() {
    return JSON.parse(localStorage.getItem(PRESET_STORAGE_KEY) || '[]');
}

function savePresets(presets) {
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

function populatePresetsList() {
    const presets = getPresets();
    presetsList.innerHTML = '';
    if (presets.length === 0) {
        presetsList.innerHTML = '<option>No presets found</option>';
    } else {
        presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            presetsList.appendChild(option);
        });
    }
}

function savePreset() {
    const name = prompt('Enter a name for this preset:');
    if (!name) return;

    const newPreset = {
        name: name,
        values: {
            resolution: resolutionSlider.value,
            spacing: spacingSlider.value,
            dotSize: dotSizeSlider.value,
            shuffle: shuffleSlider.value,
            grain: grainSlider.value,
            bgBlur: bgBlurSlider.value,
            bgOpacity: bgOpacitySlider.value,
            autoColor: autoColorToggle.checked,
            manualColor: manualColorPicker.value,
            limitPalette: limitPaletteToggle.checked,
            paletteSize: paletteSizeSlider.value,
            uniform: uniformToggle.checked,
            mixedShapes: mixedShapesToggle.checked,
            polygons: polygonsToggle.checked,
            rotation: rotationSlider.value,
            animation: animationStyleSelect.value,
        }
    };

    const presets = getPresets();
    const existingIndex = presets.findIndex(p => p.name === name);
    if (existingIndex > -1) {
        presets[existingIndex] = newPreset;
    } else {
        presets.push(newPreset);
    }
    
    savePresets(presets);
    populatePresetsList();
    presetsList.value = name;
}

function loadSelectedPreset() {
    const presets = getPresets();
    const selectedPreset = presets.find(p => p.name === presetsList.value);
    if (!selectedPreset) return;

    const { values } = selectedPreset;
    resolutionSlider.value = values.resolution;
    spacingSlider.value = values.spacing;
    dotSizeSlider.value = values.dotSize;
    shuffleSlider.value = values.shuffle || 0;
    grainSlider.value = values.grain || 0;
    bgBlurSlider.value = values.bgBlur;
    bgOpacitySlider.value = values.bgOpacity;
    autoColorToggle.checked = values.autoColor !== false; // default to true
    manualColorPicker.value = values.manualColor || '#1B1D21';
    manualColorInput.value = values.manualColor || '#1B1D21';
    limitPaletteToggle.checked = values.limitPalette;
    paletteSizeSlider.value = values.paletteSize || 8;
    uniformToggle.checked = values.uniform;
    mixedShapesToggle.checked = values.mixedShapes;
    polygonsToggle.checked = values.polygons;
    rotationSlider.value = values.rotation || 0;
    animationStyleSelect.value = values.animation || 'none';
    
    resolutionValue.textContent = values.resolution;
    spacingValue.textContent = parseFloat(values.spacing).toFixed(1);
    dotSizeValue.textContent = parseFloat(values.dotSize).toFixed(1);
    shuffleValue.textContent = values.shuffle || 0;
    grainValue.textContent = values.grain || 0;
    bgBlurValue.textContent = values.bgBlur;
    bgOpacityValue.textContent = parseFloat(values.bgOpacity).toFixed(2);
    paletteSizeValue.textContent = values.paletteSize || 8;
    rotationValue.textContent = values.rotation || 0;


    if (autoColorToggle.checked) {
        manualColorControls.classList.add('opacity-50', 'pointer-events-none');
    } else {
        manualColorControls.classList.remove('opacity-50', 'pointer-events-none');
    }
    
    updateControlStates();
    render();
}

function deleteSelectedPreset() {
    const selectedName = presetsList.value;
    if (!selectedName || !confirm(`Are you sure you want to delete the preset "${selectedName}"?`)) {
        return;
    }
    let presets = getPresets();
    presets = presets.filter(p => p.name !== selectedName);
    savePresets(presets);
    populatePresetsList();
}

// --- Core Functions ---

function rgbToHex(rgb) {
    if (!rgb || !rgb.includes('rgb')) return '#000000';
    let [r, g, b] = rgb.match(/\d+/g).map(Number);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getDominantColor(img) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 1; tempCanvas.height = 1;
    tempCtx.drawImage(img, 0, 0, 1, 1);
    const [r, g, b] = tempCtx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
}

function generateLimitedPalette(imgData, count) {
    // Simplified palette generation using quantization
    const pixels = imgData.data;
    const colorMap = {};
    const step = Math.floor(pixels.length / (count * 100)); // Sample pixels

    for (let i = 0; i < pixels.length; i += 4 * step) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        // Quantize colors by reducing color depth
        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        if (!colorMap[key]) {
            colorMap[key] = { r: 0, g: 0, b: 0, count: 0 };
        }
        colorMap[key].r += r;
        colorMap[key].g += g;
        colorMap[key].b += b;
        colorMap[key].count++;
    }

    const sortedColors = Object.values(colorMap).sort((a, b) => b.count - a.count);
    limitedPalette = sortedColors.slice(0, count).map(c => [c.r / c.count, c.g / c.count, c.b / c.count]);
}

function findNearestColor(r, g, b, palette) {
    let minDistance = Infinity;
    let nearestColor = palette[0];
    for (const color of palette) {
        const distance = Math.sqrt(Math.pow(r - color[0], 2) + Math.pow(g - color[1], 2) + Math.pow(b - color[2], 2));
        if (distance < minDistance) {
            minDistance = distance;
            nearestColor = color;
        }
    }
    return `rgb(${Math.round(nearestColor[0])}, ${Math.round(nearestColor[1])}, ${Math.round(nearestColor[2])})`;
}


function processImage() {
    const container = previewCanvas.parentElement;
    const maxWidth = container.clientWidth;
    const maxHeight = container.clientHeight;
    const aspectRatio = sourceImage.width / sourceImage.height;
    let newWidth = maxWidth;
    let newHeight = newWidth / aspectRatio;
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * aspectRatio;
    }
    sourceCanvas.width = previewCanvas.width = Math.round(newWidth);
    sourceCanvas.height = previewCanvas.height = Math.round(newHeight);
    sourceCtx.drawImage(sourceImage, 0, 0, sourceCanvas.width, sourceCanvas.height);
    imageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    dominantColor = getDominantColor(sourceImage);
    generateLimitedPalette(imageData, parseInt(paletteSizeSlider.value));
    
    if (autoColorToggle.checked) {
        const hexColor = rgbToHex(dominantColor);
        manualColorPicker.value = hexColor;
        manualColorInput.value = hexColor;
    }
    
    // Reset zoom and pan
    zoomSlider.value = 1;
    zoomValue.textContent = '1.0';
    panOffset = { x: 0, y: 0 };

    render();
}

function render() {
    stopAnimation();
    const animationStyle = animationStyleSelect.value;
    if (animationStyle !== 'none') {
        initializeAnimationDots(animationStyle);
        startAnimation();
    } else {
        drawStatic();
    }
}

function drawWithTransform(drawCallback) {
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    const zoom = parseFloat(zoomSlider.value);

    previewCtx.save();
    previewCtx.clearRect(0, 0, width, height);
    
    // Translate for panning
    previewCtx.translate(panOffset.x, panOffset.y);
    
    // Scale from the center
    previewCtx.translate(width / 2, height / 2);
    previewCtx.scale(zoom, zoom);
    previewCtx.translate(-width / 2, -height / 2);

    drawCallback();

    previewCtx.restore();
}

function drawBackground() {
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    const blur = bgBlurSlider.value;
    const opacity = bgOpacitySlider.value;
    
    const bgColor = autoColorToggle.checked ? dominantColor : manualColorPicker.value;
    previewCtx.fillStyle = bgColor;
    previewCtx.fillRect(0, 0, width, height);

    if (opacity > 0) {
        previewCtx.save();
        previewCtx.globalAlpha = opacity;
        previewCtx.filter = `blur(${blur}px)`;
        previewCtx.drawImage(sourceImage, 0, 0, width, height);
        previewCtx.restore();
    }
}

function applyGrain() {
    const grainAmount = parseInt(grainSlider.value);
    if (grainAmount <= 0) return;

    const width = previewCanvas.width;
    const height = previewCanvas.height;
    const canvasData = previewCtx.getImageData(0, 0, width, height);
    const { data } = canvasData;

    for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * grainAmount;
        data[i] += grain;
        data[i + 1] += grain;
        data[i + 2] += grain;
    }
    previewCtx.putImageData(canvasData, 0, 0);
}

function drawStatic() {
    if (!imageData) return;
    drawWithTransform(() => {
        drawBackground();
        const dotsToDraw = getDotProperties();
        dotsToDraw.forEach(dot => {
            drawShape(previewCtx, dot.shape, dot.targetX, dot.targetY, dot.radius, dot.color, dot.rotation);
        });
        applyGrain();
    });
}

function getDotProperties() {
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    
    const baseResolution = parseInt(resolutionSlider.value);
    const spacingMultiplier = parseFloat(spacingSlider.value);
    const sizeMultiplier = parseFloat(dotSizeSlider.value);
    const shuffleAmount = parseInt(shuffleSlider.value);
    const rotationAmount = parseInt(rotationSlider.value);
    const useMixedShapes = mixedShapesToggle.checked;
    const usePolygons = polygonsToggle.checked;
    const useUniformGrid = uniformToggle.checked;
    const useLimitedPalette = limitPaletteToggle.checked;

    let shapeSet = ['circle'];
    if (usePolygons) {
        shapeSet = POLYGON_SHAPES;
    } else if (useMixedShapes) {
        shapeSet = CLASSIC_SHAPES;
    }

    const actualStep = baseResolution * spacingMultiplier;
    const calculatedDots = [];

    for (let y = 0; y < height; y += actualStep) {
        for (let x = 0; x < width; x += actualStep) {
            const sampleX = Math.round(x + actualStep / 2);
            const sampleY = Math.round(y + actualStep / 2);
            
            if (sampleX >= width || sampleY >= height) continue;

            const index = (sampleY * width + sampleX) * 4;
            const r = imageData.data[index], g = imageData.data[index + 1], b = imageData.data[index + 2], a = imageData.data[index + 3];

            if (a < 128) continue;
            
            const color = useLimitedPalette ? findNearestColor(r, g, b, limitedPalette) : `rgb(${r}, ${g}, ${b})`;

            let radius;
            if (useUniformGrid) {
                radius = (baseResolution / 2) * sizeMultiplier;
            } else {
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                const invertedLuminance = 255 - luminance;
                radius = (invertedLuminance / 255) * (baseResolution / 2) * sizeMultiplier;
            }

            if (radius < 0.1) continue;
            
            const shuffleX = useUniformGrid ? 0 : (Math.random() - 0.5) * shuffleAmount;
            const shuffleY = useUniformGrid ? 0 : (Math.random() - 0.5) * shuffleAmount;

            calculatedDots.push({
                targetX: x + actualStep / 2 + shuffleX,
                targetY: y + actualStep / 2 + shuffleY,
                radius: radius,
                color: color,
                shape: shapeSet[Math.floor(Math.random() * shapeSet.length)],
                rotation: Math.random() * rotationAmount
            });
        }
    }
    return calculatedDots;
}

function initializeAnimationDots(style) {
    dots = getDotProperties().map(dot => {
        let startX = dot.targetX, startY = dot.targetY, startRadius = dot.radius, startOpacity = 1;

        if (style === 'slide') {
            const side = Math.floor(Math.random() * 4);
            switch (side) {
                case 0: startX = Math.random() * previewCanvas.width; startY = -dot.radius; break;
                case 1: startX = previewCanvas.width + dot.radius; startY = Math.random() * previewCanvas.height; break;
                case 2: startX = Math.random() * previewCanvas.width; startY = previewCanvas.height + dot.radius; break;
                case 3: default: startX = -dot.radius; startY = Math.random() * previewCanvas.height; break;
            }
        } else if (style === 'grow') {
            startRadius = 0;
        } else if (style === 'fade') {
            startOpacity = 0;
        }

        return {
            ...dot,
            currentX: startX,
            currentY: startY,
            currentRadius: startRadius,
            currentOpacity: startOpacity
        };
    });
}

function startAnimation() {
    if (animationFrameId) stopAnimation();
    animateLoop();
}

function stopAnimation() {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
}

function animateLoop() {
    drawWithTransform(() => {
        drawBackground();
        const easing = 0.05;
        const animationStyle = animationStyleSelect.value;

        dots.forEach(dot => {
            dot.currentX += (dot.targetX - dot.currentX) * easing;
            dot.currentY += (dot.targetY - dot.currentY) * easing;
            dot.currentRadius += (dot.radius - dot.currentRadius) * easing;
            dot.currentOpacity += (1 - dot.currentOpacity) * easing;
            
            previewCtx.save();
            previewCtx.globalAlpha = dot.currentOpacity;
            drawShape(previewCtx, dot.shape, dot.currentX, dot.currentY, dot.currentRadius, dot.color, dot.rotation);
            previewCtx.restore();
        });
        applyGrain();
    });
    animationFrameId = requestAnimationFrame(animateLoop);
}

function drawShape(ctx, shape, x, y, radius, color, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-x, -y);

    ctx.fillStyle = color;
    ctx.beginPath();
    switch(shape) {
        case 'square': ctx.rect(x - radius, y - radius, radius * 2, radius * 2); break;
        case 'triangle': drawPolygon(ctx, x, y, radius, 3); break;
        case 'hexagon': drawPolygon(ctx, x, y, radius, 6); break;
        case 'heptagon': drawPolygon(ctx, x, y, radius, 7); break;
        case 'decagon': drawPolygon(ctx, x, y, radius, 10); break;
        case 'circle': default: ctx.arc(x, y, radius, 0, Math.PI * 2); break;
    }
    
    ctx.fill();
    ctx.restore();
}

function drawPolygon(ctx, x, y, radius, sides) {
    if (sides < 3) return;
    const startAngle = -Math.PI / 2;
    const angle = (Math.PI * 2) / sides;
    ctx.moveTo(x + radius * Math.cos(startAngle), y + radius * Math.sin(startAngle));
    for (let i = 1; i <= sides; i++) {
        ctx.lineTo(x + radius * Math.cos(startAngle + i * angle), y + radius * Math.sin(startAngle + i * angle));
    }
}

function generateSVG() {
    if (!imageData) return '';
    const width = previewCanvas.width;
    const height = previewCanvas.height;
    const dotsToDraw = getDotProperties();
    const bgColor = autoColorToggle.checked ? dominantColor : manualColorPicker.value;
    let svgElements = [`<rect width="100%" height="100%" fill="${bgColor}" />`];
    dotsToDraw.forEach(dot => {
        let elementString = '';
        const styleProps = `fill="${dot.color}"`;
        const transform = `transform="rotate(${dot.rotation.toFixed(2)}, ${dot.targetX.toFixed(2)}, ${dot.targetY.toFixed(2)})"`;

        switch(dot.shape) {
            case 'square':
                const side = (dot.radius * 2).toFixed(2);
                elementString = `<rect x="${(dot.targetX - dot.radius).toFixed(2)}" y="${(dot.targetY - dot.radius).toFixed(2)}" width="${side}" height="${side}" ${styleProps} ${transform} />`;
                break;
            case 'triangle': elementString = generateSvgPolygon(dot.targetX, dot.targetY, dot.radius, 3, dot.color, styleProps, transform); break;
            case 'hexagon': elementString = generateSvgPolygon(dot.targetX, dot.targetY, dot.radius, 6, dot.color, styleProps, transform); break;
            case 'heptagon': elementString = generateSvgPolygon(dot.targetX, dot.targetY, dot.radius, 7, dot.color, styleProps, transform); break;
            case 'decagon': elementString = generateSvgPolygon(dot.targetX, dot.targetY, dot.radius, 10, dot.color, styleProps, transform); break;
            case 'circle': default: elementString = `<circle cx="${dot.targetX.toFixed(2)}" cy="${dot.targetY.toFixed(2)}" r="${dot.radius.toFixed(2)}" ${styleProps} ${transform} />`; break;
        }
        svgElements.push(elementString);
    });
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgElements.join('')}</svg>`;
}

function generateSvgPolygon(cx, cy, r, sides, fill, styleProps, transform) {
    let points = [];
    const startAngle = -Math.PI / 2; 
    const angle = (Math.PI * 2) / sides;
    for (let i = 0; i < sides; i++) {
        const x_i = cx + r * Math.cos(startAngle + i * angle);
        const y_i = cy + r * Math.sin(startAngle + i * angle);
        points.push(`${x_i.toFixed(2)},${y_i.toFixed(2)}`);
    }
    return `<polygon points="${points.join(' ')}" ${styleProps} ${transform} />`;
}

// Initial Load
populatePresetsList();
updateControlStates();