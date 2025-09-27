# Player with mini framework

A minimalist music player built with a custom mini-framework featuring reactivity.

## 🚀 Quick Start

### Install Dependencies
```bash
bun install
```

### Development
```bash
bun run dev
```

### Build
```bash
bun run build
```

### Production
```bash
bun run start:prod
```

## 📁 Project Structure

```
src/
├── audio/           # Audio controller and utilities
├── utils/           # Utilities (DOM, reactivity, icons)
├── Player.ts        # Main player component
├── main.ts          # Entry point
├── types.ts         # TypeScript types
└── style.css        # Styles

scripts/
└── update-playlist.ts  # Playlist update script

tests/
├── dom.test.ts         # DOM utilities tests
├── reactivity.test.ts  # Reactivity tests
└── setup.ts            # Test setup
```
## 🔧 Technologies

- **TypeScript** - Typed JavaScript
- **Vite** - Fast build tool
- **Biome** - Linter and code formatter
- **Bun** - Fast JavaScript runtime and package manager
- **Music Metadata** - MP3 metadata extraction

## 📝 License

MIT
