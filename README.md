# WhitelistToken Frontend

A Next.js-based web application for interacting with the WhitelistToken smart contracts. Provides a user-friendly interface for token management, whitelist checking, and wallet integration.

## 🚀 Features

- **Wallet Integration** - Connect with MetaMask and other Web3 wallets
- **Token Information** - View token details, balance, and supply
- **Whitelist Status** - Check if addresses are whitelisted
- **Sale Interface** - Participate in token sales
- **Real-time Updates** - Live data from the blockchain
- **Responsive Design** - Mobile-friendly interface

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: ethers.js for blockchain interaction
- **State Management**: React Query for server state
- **UI Components**: Custom components with Tailwind

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible Web3 wallet
- Running backend API (port 8080)
- Deployed smart contracts on local network

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create `.env.local` file:
```env
# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_SALE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── layout/         # Layout components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── pages/              # Next.js pages
├── styles/             # Global styles
└── utils/              # Utility functions
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Testing
npm run test            # Run tests (if configured)
```

## 🌐 Key Components

### Layout Components
- **`Layout.tsx`** - Main application layout wrapper
- **`Container.tsx`** - Content container with responsive padding

### UI Components
- **`Button.tsx`** - Reusable button component
- **`Card.tsx`** - Card container for content sections
- **`ErrorBoundary.tsx`** - Error boundary for React error handling

### Hooks
- **`useSaleInfo.ts`** - Fetch and manage sale information
- **`useWhitelistStatus.ts`** - Check whitelist status for addresses

### Contexts
- **`AppContext.tsx`** - Global application state management

## 🔗 API Integration

The frontend connects to the backend API for:
- Token information retrieval
- Whitelist status checking
- Sale data fetching
- Analytics and metrics

### Example API Calls
```typescript
// Get token information
const response = await fetch(`${API_URL}/v1/token/info`);

// Check whitelist status
const status = await fetch(`${API_URL}/v1/whitelist/status/${address}`);

// Get sale information
const saleInfo = await fetch(`${API_URL}/v1/sale/info`);
```

## 🎨 Styling

### Tailwind CSS Configuration
- Custom color scheme
- Responsive breakpoints
- Component utilities
- Dark mode support (if implemented)

### Key Design Principles
- Mobile-first responsive design
- Consistent spacing and typography
- Accessible color contrasts
- Clean, modern interface

## 🔐 Web3 Integration

### Wallet Connection
```typescript
// Connect to MetaMask wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
```

### Contract Interaction
```typescript
// Interact with WhitelistToken contract
const tokenContract = new ethers.Contract(
  TOKEN_ADDRESS,
  tokenABI,
  signer
);

const balance = await tokenContract.balanceOf(address);
```

## 📱 Features Overview

### 1. Dashboard
- Token balance display
- Whitelist status indicator
- Recent transactions

### 2. Token Information
- Contract details
- Supply information
- Owner information

### 3. Whitelist Management
- Check whitelist status
- View whitelisted addresses
- Request whitelist access

### 4. Token Sale Interface
- Purchase tokens
- View sale progress
- Sale timeline information

## 🚨 Error Handling

- **Network Errors** - Graceful handling of RPC failures
- **Wallet Errors** - User-friendly wallet connection issues
- **Transaction Errors** - Clear error messages for failed transactions
- **React Errors** - Error boundaries prevent app crashes

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_CHAIN_ID` - Blockchain network ID
- `NEXT_PUBLIC_RPC_URL` - RPC endpoint URL
- `NEXT_PUBLIC_TOKEN_ADDRESS` - WhitelistToken contract address
- `NEXT_PUBLIC_SALE_ADDRESS` - WhitelistSale contract address
- `NEXT_PUBLIC_API_URL` - Backend API base URL

### Network Configuration
The app is configured for Hardhat local network by default. Update environment variables for other networks.

## 📚 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React hooks patterns
- Implement proper error boundaries
- Use semantic HTML elements

### Performance
- Implement React Query for data caching
- Optimize bundle size with code splitting
- Use Next.js Image optimization
- Minimize re-renders with proper dependencies

## 🤝 Contributing

1. Follow the existing code structure
2. Add TypeScript types for all new code
3. Test wallet integration thoroughly
4. Ensure responsive design on all devices
5. Add error handling for edge cases

## 🔗 Related Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [ethers.js Documentation](https://docs.ethers.org/)
- [React Query Documentation](https://tanstack.com/query/latest)