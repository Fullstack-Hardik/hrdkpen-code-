const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  theme: { type: String, default: 'dark' },
  terminalFont: { type: String, default: 'JetBrains Mono' },
  terminalFontSize: { type: Number, default: 14 },
  terminalBackground: { type: String, default: '#1a1a1a' },
  terminalTextColor: { type: String, default: '#ffffff' },
  editorFont: { type: String, default: 'JetBrains Mono' },
  editorFontSize: { type: Number, default: 14 },
  editorTabSize: { type: Number, default: 2 },
  autoSave: { type: Boolean, default: true },
  lineNumbers: { type: Boolean, default: true },
  wordWrap: { type: Boolean, default: true },
  terminalOpacity: { type: Number, default: 95 },
  enableAnimations: { type: Boolean, default: true },
  compactMode: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
