// Use electronAPI from preload script instead of require

class ImageEditor {
    constructor() {
        this.canvas = null;
        this.currentTool = 'select';
        this.isDrawing = false;
        this.currentPath = null;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 50;
        this.currentImagePath = null;
        this.hasUnsavedChanges = false;
        
        // Drawing state
        this.startX = 0;
        this.startY = 0;
        this.currentObject = null;
        
        this.init();
    }

    async init() {
        try {
            await this.setupCanvas();
            this.setupEventListeners();
            this.setupIPCListeners();
            this.setupKeyboardShortcuts();
            this.applyTheme();
            
            // Hide loading and show editor
            document.getElementById('loadingSection').classList.add('hidden');
            document.getElementById('editorSection').classList.remove('hidden');
            
            this.updateStatus('Image editor ready');
        } catch (error) {
            console.error('Failed to initialize image editor:', error);
            this.updateStatus('Failed to initialize editor');
        }
    }

    async setupCanvas() {
        const canvasElement = document.getElementById('canvas');
        
        // Wait for Fabric.js to be available
        if (typeof fabric === 'undefined') {
            throw new Error('Fabric.js is not loaded');
        }
        
        // Initialize Fabric.js canvas
        this.canvas = new fabric.Canvas(canvasElement, {
            width: 800,
            height: 600,
            backgroundColor: 'white',
            selection: true,
            preserveObjectStacking: true
        });

        // Set up canvas event listeners
        this.canvas.on('mouse:down', this.onMouseDown.bind(this));
        this.canvas.on('mouse:move', this.onMouseMove.bind(this));
        this.canvas.on('mouse:up', this.onMouseUp.bind(this));
        this.canvas.on('path:created', this.onPathCreated.bind(this));
        this.canvas.on('object:added', this.onObjectAdded.bind(this));
        this.canvas.on('object:modified', this.onObjectModified.bind(this));
        this.canvas.on('selection:created', this.onSelectionChanged.bind(this));
        this.canvas.on('selection:updated', this.onSelectionChanged.bind(this));
        this.canvas.on('selection:cleared', this.onSelectionCleared.bind(this));

        // Save initial state
        this.saveState();
    }

    setupEventListeners() {
        // Tool buttons
        document.getElementById('selectTool').addEventListener('click', () => this.setTool('select'));
        document.getElementById('penTool').addEventListener('click', () => this.setTool('pen'));
        document.getElementById('lineTool').addEventListener('click', () => this.setTool('line'));
        document.getElementById('arrowTool').addEventListener('click', () => this.setTool('arrow'));
        document.getElementById('rectTool').addEventListener('click', () => this.setTool('rect'));
        document.getElementById('circleTool').addEventListener('click', () => this.setTool('circle'));
        document.getElementById('textTool').addEventListener('click', () => this.setTool('text'));

        // Style controls
        document.getElementById('strokeColor').addEventListener('click', this.showColorPicker.bind(this, 'stroke'));
        document.getElementById('fillColor').addEventListener('click', this.showColorPicker.bind(this, 'fill'));
        
        const strokeWidthSlider = document.getElementById('strokeWidth');
        strokeWidthSlider.addEventListener('input', this.updateStrokeWidth.bind(this));
        
        const blurSlider = document.getElementById('blurAmount');
        blurSlider.addEventListener('input', this.updateBlurAmount.bind(this));

        // Effect tools
        document.getElementById('blurTool').addEventListener('click', this.applyBlurEffect.bind(this));
        document.getElementById('highlightTool').addEventListener('click', () => this.setTool('highlight'));

        // Action buttons
        document.getElementById('undoBtn').addEventListener('click', this.undo.bind(this));
        document.getElementById('redoBtn').addEventListener('click', this.redo.bind(this));
        document.getElementById('deleteBtn').addEventListener('click', this.deleteSelected.bind(this));
        document.getElementById('saveBtn').addEventListener('click', this.save.bind(this));
        document.getElementById('exportBtn').addEventListener('click', this.export.bind(this));

        // Mouse position tracking
        this.canvas.on('mouse:move', (e) => {
            const pointer = this.getCanvasPointer(e.e);
            document.getElementById('positionInfo').textContent = 
                `X: ${Math.round(pointer.x)}, Y: ${Math.round(pointer.y)}`;
        });
    }

    setupIPCListeners() {
        // Listen for file to open
        window.electronAPI.onOpenImageFile((event, filePath) => {
            this.loadImage(filePath);
        });

        // Listen for theme changes
        window.electronAPI.onThemeChanged((event, theme) => {
            this.applyTheme(theme);
        });

        // Listen for save requests
        window.electronAPI.onSaveImage(() => {
            this.save();
        });

        // Listen for export requests
        window.electronAPI.onExportImage(() => {
            this.export();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent default for our shortcuts
            if ((e.ctrlKey || e.metaKey) && ['s', 'z', 'y'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }

            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'v': this.setTool('select'); break;
                    case 'p': this.setTool('pen'); break;
                    case 'l': this.setTool('line'); break;
                    case 'a': this.setTool('arrow'); break;
                    case 'r': this.setTool('rect'); break;
                    case 'c': this.setTool('circle'); break;
                    case 't': this.setTool('text'); break;
                    case 'delete':
                    case 'backspace':
                        this.deleteSelected();
                        break;
                }
            }

            // Action shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        this.save();
                        break;
                    case 'z':
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        this.redo();
                        break;
                }
            }
        });
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tool + 'Tool').classList.add('active');
        
        // Configure canvas based on tool
        switch (tool) {
            case 'select':
                this.canvas.isDrawingMode = false;
                this.canvas.selection = true;
                this.canvas.defaultCursor = 'default';
                break;
            case 'pen':
                this.canvas.isDrawingMode = true;
                this.canvas.selection = false;
                this.setupPenBrush();
                break;
            case 'highlight':
                this.canvas.isDrawingMode = true;
                this.canvas.selection = false;
                this.setupHighlightBrush();
                break;
            default:
                this.canvas.isDrawingMode = false;
                this.canvas.selection = false;
                this.canvas.defaultCursor = 'crosshair';
                break;
        }
        
        this.updateStatus(`Tool: ${tool}`);
    }

    setupPenBrush() {
        const brush = new fabric.PencilBrush(this.canvas);
        brush.width = parseInt(document.getElementById('strokeWidth').value);
        brush.color = this.getCurrentStrokeColor();
        brush.limitedToCanvasSize = true;
        this.canvas.freeDrawingBrush = brush;
    }

    setupHighlightBrush() {
        const brush = new fabric.PencilBrush(this.canvas);
        brush.width = parseInt(document.getElementById('strokeWidth').value) * 3; // Thicker for highlight
        brush.color = this.getCurrentStrokeColor();
        brush.globalCompositeOperation = 'multiply'; // Highlight effect
        brush.limitedToCanvasSize = true;
        this.canvas.freeDrawingBrush = brush;
    }

    onMouseDown(e) {
        if (this.canvas.isDrawingMode) return;
        
        const pointer = this.getCanvasPointer(e.e);
        
        // Check if the click is within image bounds
        if (!this.isPointInImageBounds(e)) {
            this.updateStatus('Please draw within the image bounds');
            return;
        }
        
        this.startX = pointer.x;
        this.startY = pointer.y;
        this.isDrawing = true;

        switch (this.currentTool) {
            case 'line':
                this.startDrawingLine(pointer);
                break;
            case 'arrow':
                this.startDrawingArrow(pointer);
                break;
            case 'rect':
                this.startDrawingRect(pointer);
                break;
            case 'circle':
                this.startDrawingCircle(pointer);
                break;
            case 'text':
                this.addText(pointer);
                break;
        }
    }

    onMouseMove(e) {
        if (!this.isDrawing || this.canvas.isDrawingMode) return;
        
        const pointer = this.getCanvasPointer(e.e);
        
        switch (this.currentTool) {
            case 'line':
                this.updateLine(pointer);
                break;
            case 'arrow':
                this.updateArrow(pointer);
                break;
            case 'rect':
                this.updateRect(pointer);
                break;
            case 'circle':
                this.updateCircle(pointer);
                break;
        }
    }

    onMouseUp(e) {
        if (!this.isDrawing || this.canvas.isDrawingMode) return;
        
        this.isDrawing = false;
        this.currentObject = null;
        this.saveState();
    }

    startDrawingLine(pointer) {
        // Constrain start point to image bounds
        const constrainedStart = this.constrainPointToImageBounds(this.startX, this.startY);
        this.startX = constrainedStart.x;
        this.startY = constrainedStart.y;
        
        const line = new fabric.Line([this.startX, this.startY, this.startX, this.startY], {
            stroke: this.getCurrentStrokeColor(),
            strokeWidth: parseInt(document.getElementById('strokeWidth').value),
            selectable: false
        });
        this.canvas.add(line);
        this.currentObject = line;
    }

    updateLine(pointer) {
        if (this.currentObject) {
            // Constrain end point to image bounds
            const constrainedEnd = this.constrainPointToImageBounds(pointer.x, pointer.y);
            this.currentObject.set({
                x2: constrainedEnd.x,
                y2: constrainedEnd.y
            });
            this.canvas.renderAll();
        }
    }

    startDrawingArrow(pointer) {
        // Constrain start point to image bounds
        const constrainedStart = this.constrainPointToImageBounds(this.startX, this.startY);
        this.startX = constrainedStart.x;
        this.startY = constrainedStart.y;
        
        // Create arrow as a group of line + triangle
        const line = new fabric.Line([this.startX, this.startY, this.startX, this.startY], {
            stroke: this.getCurrentStrokeColor(),
            strokeWidth: parseInt(document.getElementById('strokeWidth').value)
        });
        
        const arrowHead = new fabric.Triangle({
            left: this.startX,
            top: this.startY,
            width: 10,
            height: 10,
            fill: this.getCurrentStrokeColor(),
            angle: 0
        });
        
        const arrow = new fabric.Group([line, arrowHead], {
            selectable: false
        });
        
        this.canvas.add(arrow);
        this.currentObject = arrow;
    }

    updateArrow(pointer) {
        if (this.currentObject) {
            // Constrain current pointer to image bounds
            const constrainedPointer = this.constrainPointToImageBounds(pointer.x, pointer.y);
            const objects = this.currentObject.getObjects();
            const line = objects[0];
            const arrowHead = objects[1];
            
            // Update line
            line.set({
                x2: constrainedPointer.x - this.startX,
                y2: constrainedPointer.y - this.startY
            });
            
            // Update arrow head position and rotation
            const angle = Math.atan2(constrainedPointer.y - this.startY, constrainedPointer.x - this.startX) * 180 / Math.PI;
            arrowHead.set({
                left: constrainedPointer.x - this.startX,
                top: constrainedPointer.y - this.startY,
                angle: angle + 90
            });
            
            this.canvas.renderAll();
        }
    }

    startDrawingRect(pointer) {
        // Constrain start point to image bounds
        const constrainedStart = this.constrainPointToImageBounds(this.startX, this.startY);
        this.startX = constrainedStart.x;
        this.startY = constrainedStart.y;
        
        const rect = new fabric.Rect({
            left: this.startX,
            top: this.startY,
            width: 0,
            height: 0,
            stroke: this.getCurrentStrokeColor(),
            strokeWidth: parseInt(document.getElementById('strokeWidth').value),
            fill: this.getCurrentFillColor(),
            selectable: false
        });
        this.canvas.add(rect);
        this.currentObject = rect;
    }

    updateRect(pointer) {
        if (this.currentObject) {
            // Constrain current pointer to image bounds
            const constrainedPointer = this.constrainPointToImageBounds(pointer.x, pointer.y);
            const width = constrainedPointer.x - this.startX;
            const height = constrainedPointer.y - this.startY;
            
            this.currentObject.set({
                width: Math.abs(width),
                height: Math.abs(height),
                left: width < 0 ? constrainedPointer.x : this.startX,
                top: height < 0 ? constrainedPointer.y : this.startY
            });
            this.canvas.renderAll();
        }
    }

    startDrawingCircle(pointer) {
        // Constrain start point to image bounds
        const constrainedStart = this.constrainPointToImageBounds(this.startX, this.startY);
        this.startX = constrainedStart.x;
        this.startY = constrainedStart.y;
        
        const circle = new fabric.Circle({
            left: this.startX,
            top: this.startY,
            radius: 0,
            stroke: this.getCurrentStrokeColor(),
            strokeWidth: parseInt(document.getElementById('strokeWidth').value),
            fill: this.getCurrentFillColor(),
            selectable: false
        });
        this.canvas.add(circle);
        this.currentObject = circle;
    }

    updateCircle(pointer) {
        if (this.currentObject) {
            // Constrain current pointer to image bounds
            const constrainedPointer = this.constrainPointToImageBounds(pointer.x, pointer.y);
            const radius = Math.sqrt(
                Math.pow(constrainedPointer.x - this.startX, 2) + 
                Math.pow(constrainedPointer.y - this.startY, 2)
            ) / 2;
            
            // Also constrain the circle to not extend beyond image bounds
            const maxRadius = Math.min(
                this.imageBounds.left + this.imageBounds.width - this.startX,
                this.imageBounds.top + this.imageBounds.height - this.startY,
                this.startX - this.imageBounds.left,
                this.startY - this.imageBounds.top
            );
            
            const constrainedRadius = Math.min(radius, maxRadius);
            
            this.currentObject.set({
                radius: constrainedRadius,
                left: this.startX - constrainedRadius,
                top: this.startY - constrainedRadius
            });
            this.canvas.renderAll();
        }
    }

    addText(pointer) {
        // Constrain text position to image bounds
        const constrainedPointer = this.constrainPointToImageBounds(pointer.x, pointer.y);
        
        const text = new fabric.IText('Click to edit', {
            left: constrainedPointer.x,
            top: constrainedPointer.y,
            fontFamily: 'Arial',
            fontSize: 20,
            fill: this.getCurrentStrokeColor()
        });
        
        this.canvas.add(text);
        this.canvas.setActiveObject(text);
        text.enterEditing();
        this.saveState();
    }

    getCurrentStrokeColor() {
        return document.getElementById('strokeColor').style.backgroundColor || '#000000';
    }

    getCurrentFillColor() {
        const fillElement = document.getElementById('fillColor');
        return fillElement.style.backgroundColor === 'transparent' ? 
               'transparent' : (fillElement.style.backgroundColor || 'transparent');
    }

    showColorPicker(type) {
        // Create a hidden input element for color picking
        const input = document.createElement('input');
        input.type = 'color';
        input.style.display = 'none';
        
        if (type === 'stroke') {
            input.value = this.hexFromRgb(this.getCurrentStrokeColor()) || '#000000';
        } else {
            input.value = this.hexFromRgb(this.getCurrentFillColor()) || '#000000';
        }
        
        input.addEventListener('change', (e) => {
            const color = e.target.value;
            if (type === 'stroke') {
                document.getElementById('strokeColor').style.backgroundColor = color;
            } else {
                document.getElementById('fillColor').style.backgroundColor = color;
            }
            document.body.removeChild(input);
        });
        
        document.body.appendChild(input);
        input.click();
    }

    hexFromRgb(rgb) {
        if (!rgb || rgb === 'transparent') return null;
        
        const result = rgb.match(/\d+/g);
        if (!result) return null;
        
        return '#' + result.map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    updateStrokeWidth() {
        const width = document.getElementById('strokeWidth').value;
        document.getElementById('strokeWidthValue').textContent = width;
        
        if (this.canvas.isDrawingMode) {
            this.canvas.freeDrawingBrush.width = parseInt(width);
        }
    }

    updateBlurAmount() {
        const blur = document.getElementById('blurAmount').value;
        document.getElementById('blurAmountValue').textContent = blur;
    }

    applyBlurEffect() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) {
            this.updateStatus('Select an object to apply blur effect');
            return;
        }
        
        const blurAmount = parseInt(document.getElementById('blurAmount').value);
        if (blurAmount > 0) {
            activeObject.filters = [new fabric.Image.filters.Blur({ blur: blurAmount / 10 })];
            activeObject.applyFilters();
            this.canvas.renderAll();
            this.saveState();
            this.updateStatus(`Applied blur effect: ${blurAmount}`);
        }
    }

    onPathCreated(e) {
        this.saveState();
        this.markAsModified();
    }

    onObjectAdded(e) {
        this.markAsModified();
    }

    onObjectModified(e) {
        this.saveState();
        this.markAsModified();
    }

    onSelectionChanged(e) {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            this.updateStatus(`Selected: ${activeObject.type}`);
        }
    }

    onSelectionCleared(e) {
        this.updateStatus('Ready');
    }

    deleteSelected() {
        const activeObjects = this.canvas.getActiveObjects();
        if (activeObjects.length > 0) {
            activeObjects.forEach(obj => this.canvas.remove(obj));
            this.canvas.discardActiveObject();
            this.canvas.renderAll();
            this.saveState();
            this.updateStatus(`Deleted ${activeObjects.length} object(s)`);
        }
    }

    saveState() {
        const state = JSON.stringify(this.canvas.toJSON());
        this.undoStack.push(state);
        
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        this.redoStack = []; // Clear redo stack when new action is performed
    }

    undo() {
        if (this.undoStack.length > 1) {
            this.redoStack.push(this.undoStack.pop());
            const previousState = this.undoStack[this.undoStack.length - 1];
            this.loadCanvasState(previousState);
            this.updateStatus('Undo');
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(nextState);
            this.loadCanvasState(nextState);
            this.updateStatus('Redo');
        }
    }

    loadCanvasState(state) {
        this.canvas.loadFromJSON(state, () => {
            this.canvas.renderAll();
        });
    }

    async loadImage(filePath) {
        try {
            this.currentImagePath = filePath;
            
            // Load image using Fabric.js
            fabric.Image.fromURL(`file://${filePath}`, (img) => {
                // Store original image dimensions
                this.originalImageWidth = img.width;
                this.originalImageHeight = img.height;
                
                // Calculate canvas size to fit the image perfectly
                const maxCanvasWidth = 1200;
                const maxCanvasHeight = 800;
                
                let canvasWidth = img.width;
                let canvasHeight = img.height;
                
                // Scale down if image is too large
                if (canvasWidth > maxCanvasWidth || canvasHeight > maxCanvasHeight) {
                    const scale = Math.min(maxCanvasWidth / canvasWidth, maxCanvasHeight / canvasHeight);
                    canvasWidth = Math.floor(canvasWidth * scale);
                    canvasHeight = Math.floor(canvasHeight * scale);
                }
                
                // Resize canvas to match image
                this.canvas.setDimensions({
                    width: canvasWidth,
                    height: canvasHeight
                });
                

                
                // Scale image to fit the canvas exactly
                const scaleX = canvasWidth / img.width;
                const scaleY = canvasHeight / img.height;
                
                img.set({
                    left: 0,
                    top: 0,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    selectable: false,
                    evented: false, // Prevent interaction with background image
                    excludeFromExport: false
                });
                
                // Clear canvas and add image as background
                this.canvas.clear();
                this.canvas.add(img);
                img.sendToBack();
                
                // Store image reference and bounds
                this.backgroundImage = img;
                this.imageBounds = {
                    left: 0,
                    top: 0,
                    width: canvasWidth,
                    height: canvasHeight
                };
                
                // Set up clipping path to constrain drawing to image bounds
                this.setupImageClipping();
                

                
                this.canvas.renderAll();
                this.saveState();
                this.hasUnsavedChanges = false;
                this.updateStatus(`Loaded: ${filePath.split('/').pop()}`);
            });
            
        } catch (error) {
            console.error('Failed to load image:', error);
            this.updateStatus('Failed to load image');
        }
    }

    async save() {
        try {
            if (!this.currentImagePath) {
                this.updateStatus('No image loaded to save');
                return;
            }
            
            // Export canvas as image data
            const dataURL = this.canvas.toDataURL({
                format: 'png',
                quality: 1.0
            });
            
            // Send to main process for saving
            const result = await window.electronAPI.saveAnnotatedImage({
                originalPath: this.currentImagePath,
                imageData: dataURL
            });
            
            if (result.success) {
                this.hasUnsavedChanges = false;
                this.updateStatus(`Saved: ${result.savedPath.split('/').pop()}`);
            } else {
                this.updateStatus('Failed to save image');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            this.updateStatus('Failed to save image');
        }
    }

    async export() {
        try {
            const dataURL = this.canvas.toDataURL({
                format: 'png',
                quality: 1.0
            });
            
            const result = await window.electronAPI.exportAnnotatedImage({
                imageData: dataURL
            });
            
            if (result.success) {
                this.updateStatus(`Exported: ${result.exportPath.split('/').pop()}`);
            } else {
                this.updateStatus('Failed to export image');
            }
        } catch (error) {
            console.error('Failed to export:', error);
            this.updateStatus('Failed to export image');
        }
    }

    setupImageClipping() {
        // Create a clipping path that matches the image bounds
        const clipPath = new fabric.Rect({
            left: this.imageBounds.left,
            top: this.imageBounds.top,
            width: this.imageBounds.width,
            height: this.imageBounds.height,
            absolutePositioned: true
        });
        
        // Apply clipping to the canvas
        this.canvas.clipPath = clipPath;
        
        // Override the canvas drawing methods to constrain to image bounds
        this.constrainDrawingToImageBounds();
    }

    constrainDrawingToImageBounds() {
        // Add event listener to constrain free drawing paths
        this.canvas.on('path:created', (e) => {
            const path = e.path;
            if (path && this.imageBounds) {
                // Constrain the path to image bounds
                const pathBounds = path.getBoundingRect();
                
                // Check if path extends beyond image bounds
                if (pathBounds.left < this.imageBounds.left ||
                    pathBounds.top < this.imageBounds.top ||
                    pathBounds.left + pathBounds.width > this.imageBounds.left + this.imageBounds.width ||
                    pathBounds.top + pathBounds.height > this.imageBounds.top + this.imageBounds.height) {
                    
                    // Remove the path if it's outside bounds
                    this.canvas.remove(path);
                    this.updateStatus('Drawing outside image bounds is not allowed');
                }
            }
        });
        
        // Constrain free drawing brush
        if (this.canvas.freeDrawingBrush) {
            this.canvas.freeDrawingBrush.limitedToCanvasSize = true;
        }
    }

    isPointInImageBounds(e) {
        if (!this.imageBounds) return true;
        
        const pointer = this.getCanvasPointer(e.e);
        return (
            pointer.x >= this.imageBounds.left &&
            pointer.x <= this.imageBounds.left + this.imageBounds.width &&
            pointer.y >= this.imageBounds.top &&
            pointer.y <= this.imageBounds.top + this.imageBounds.height
        );
    }

    constrainPointToImageBounds(x, y) {
        if (!this.imageBounds) return { x, y };
        
        return {
            x: Math.max(this.imageBounds.left, Math.min(x, this.imageBounds.left + this.imageBounds.width)),
            y: Math.max(this.imageBounds.top, Math.min(y, this.imageBounds.top + this.imageBounds.height))
        };
    }

    // Get pointer coordinates accounting for canvas positioning
    getCanvasPointer(e) {
        const canvasElement = this.canvas.getElement();
        const rect = canvasElement.getBoundingClientRect();
        
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }



    markAsModified() {
        this.hasUnsavedChanges = true;
    }

    applyTheme(theme) {
        // Get theme from localStorage if not provided
        if (!theme) {
            theme = localStorage.getItem('maraikka-theme') || 'dark';
        }
        
        const html = document.documentElement;
        html.className = theme === 'light' ? 'light-theme' : 'dark';
        
        // Store theme for consistency
        localStorage.setItem('maraikka-theme', theme);
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
        console.log('Image Editor:', message);
    }
}

// Initialize the image editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all scripts are loaded
    setTimeout(() => {
        try {
            new ImageEditor();
        } catch (error) {
            console.error('Failed to initialize image editor:', error);
            document.getElementById('loadingSection').innerHTML = `
                <div style="color: #ef4444; text-align: center;">
                    <h3>Failed to load image editor</h3>
                    <p>${error.message}</p>
                    <p>Please refresh the window to try again.</p>
                </div>
            `;
        }
    }, 100);
}); 