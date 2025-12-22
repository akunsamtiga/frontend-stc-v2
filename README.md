# Binary Option Trading Platform - Frontend

Modern, professional binary option trading platform built with Next.js 15, TypeScript, and TailwindCSS v4.

## 🎯 Features

### Core Features
- 🎨 **Modern Dark Theme** - Professional trading interface
- 📊 **Real-time Price Streaming** - Firebase integration
- ⚡ **Instant Order Execution** - CALL/PUT options
- 📱 **Fully Responsive** - Mobile, tablet, desktop
- 🔐 **Secure Authentication** - JWT-based auth
- 💰 **Balance Management** - Deposits & withdrawals
- 📈 **Order History** - Complete trading history
- 👤 **User Profile** - Account management
- 🛡️ **Admin Panel** - User & asset management

### Technical Features
- ⚡ Next.js 15 App Router
- 🎨 TailwindCSS v4
- 📘 TypeScript (strict mode)
- 🐻 Zustand (state management)
- 🔥 Firebase (real-time DB)
- 📊 Lightweight Charts
- 🎉 Sonner (toasts)
- ✅ React Hook Form + Zod

## 🚀 Quick Start

### 1. Run Setup Script
```bash
bash setupFEv2.sh
cd frontend-trading
```

### 2. Configure Environment
Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend-trading/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   ├── globals.css          # Global styles
│   ├── trading/             # Trading page
│   ├── history/             # Order history
│   ├── balance/             # Balance management
│   ├── profile/             # User profile
│   └── admin/               # Admin dashboard
├── components/
│   ├── Navbar.tsx           # Main navigation
│   └── PriceDisplay.tsx     # Price display
├── lib/
│   ├── api.ts               # API client
│   ├── firebase.ts          # Firebase config
│   └── utils.ts             # Utility functions
├── store/
│   ├── auth.ts              # Auth store
│   └── trading.ts           # Trading store
├── types/
│   └── index.ts             # TypeScript types
└── public/                  # Static assets
```

## 🎨 Design System

### Colors
- Background: `#0f172a`, `#1e293b`, `#334155`
- Primary: `#3b82f6`
- Success (UP): `#10b981`
- Danger (DOWN): `#ef4444`

### Typography
- Sans: Inter
- Mono: JetBrains Mono

### Components
- Buttons: `.btn`, `.btn-primary`, `.btn-success`, `.btn-danger`
- Cards: `.card`
- Inputs: Auto-styled with TailwindCSS

## 📡 API Integration

### Backend URL
```
http://localhost:3000/api/v1
```

### Endpoints Used
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /user/profile` - Get profile
- `GET /balance/current` - Get balance
- `POST /balance` - Deposit/withdraw
- `GET /assets` - Get assets
- `GET /assets/:id/price` - Get price
- `POST /binary-orders` - Create order
- `GET /binary-orders` - Get orders

## 🔥 Firebase Setup

### Configuration
1. Create Firebase project
2. Enable Realtime Database
3. Get config from Firebase Console
4. Add to `.env.local`

### Real-time Price Streaming
```typescript
subscribeToPriceUpdates('/idx_stc/current_price', (data) => {
  setCurrentPrice(data)
})
```

## 🎮 Usage

### Login
1. Go to `http://localhost:3000`
2. Enter credentials or register
3. Click "Sign In"

### Trading
1. Select asset
2. Enter amount
3. Choose duration (1-60 minutes)
4. Click CALL (up) or PUT (down)
5. Wait for settlement

### Balance Management
1. Go to Balance page
2. Click Deposit or Withdraw
3. Enter amount
4. Confirm transaction

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run type-check # Type checking
```

### Adding New Pages
```typescript
// app/new-page/page.tsx
'use client'

export default function NewPage() {
  return <div>New Page</div>
}
```

### Adding New API Calls
```typescript
// lib/api.ts
async newEndpoint() {
  return this.client.get('/new-endpoint')
}
```

## 🎨 Customization

### Change Theme Colors
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: '#your-color',
  // ...
}
```

### Modify Layout
Edit `app/layout.tsx` and `components/Navbar.tsx`

### Add New Features
1. Create component in `components/`
2. Add types in `types/`
3. Add API calls in `lib/api.ts`
4. Create page in `app/`

## 📱 Responsive Design

- Desktop: 1920px+
- Tablet: 768px - 1919px
- Mobile: 375px - 767px

All components are fully responsive.

## 🔒 Security

- JWT tokens stored in localStorage
- Automatic token refresh
- Protected routes with middleware
- HTTPS in production

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment Variables
Set in Vercel dashboard or `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://your-api.com/api/v1
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-db.firebaseio.com/
```

## 🐛 Troubleshooting

### API Connection Error
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running

### Firebase Connection Error
- Verify Firebase config
- Check Realtime Database rules
- Enable Firebase in console

### Build Errors
```bash
npm run type-check  # Check TypeScript errors
npm run lint        # Check ESLint errors
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS](https://tailwindcss.com)
- [Firebase](https://firebase.google.com/docs)
- [Zustand](https://zustand-demo.pmnd.rs/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT

---

**Built with ❤️ using Next.js 15 & TailwindCSS v4**

Version: 2.0.0 | Binary Option Trading Platform
