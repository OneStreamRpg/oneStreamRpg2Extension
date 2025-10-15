# oneStreamRpg2Extension

## 🎮 Personal Player Channel System

This project includes a **complete implementation** of the Personal Player Channel system with:
- ✅ Optimistic updates (instant UI feedback)
- ✅ Automatic rollback on errors
- ✅ Real-time state synchronization
- ✅ Reconnection handling
- ✅ Full TypeScript support

### 📚 Documentation

- **[Quick Start Guide](./PERSONAL_CHANNEL_QUICK_START.md)** - Get started in 5 minutes
- **[Implementation Details](./PERSONAL_CHANNEL_IMPLEMENTATION.md)** - Complete technical documentation
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Integrate into existing components
- **[Summary](./README_PERSONAL_CHANNEL.md)** - Implementation overview

### 🚀 Usage

```tsx
import { usePersonalChannelStore } from "./store/personalChannelStore";
import { usePersonalChannelActions } from "./hooks/usePersonalChannelActions";

// Read state
const { displayedState, isReady } = usePersonalChannelStore();

// Send actions
const { socket } = useSocketStore();
const { equipItem, unequipItem } = usePersonalChannelActions(socket);
```

See examples in `src/examples/` and `src/components/inventory/`

---

## ⚙️ Prerequisites

- **Node.js**: LTS version (e.g. ≥ 22.x)
- **pnpm**: package manager  
  Install from https://pnpm.io/installation

