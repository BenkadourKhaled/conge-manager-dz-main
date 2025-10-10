# Système de Gestion des Congés - CNAS Constantine

Application moderne de gestion des congés annuels pour l'Agence CNAS de Constantine, développée avec React 18, TypeScript et Tailwind CSS.

## 🚀 Fonctionnalités

### Gestion des Employés
- Liste complète des employés avec recherche et filtres
- Fiche détaillée avec historique de congés
- Gestion des statuts (Actif, Suspendu, Maladie)
- Affectation aux services et sous-directions

### Demandes de Congé
- Création de demandes avec calcul automatique des jours
- Workflow d'approbation (En Attente, Approuvé, Rejeté, Reporté)
- Vérification du solde disponible en temps réel
- Gestion des adresses pendant les congés

### Suivi ICA (Indemnité Compensatrice d'Absence)
- Tableau de bord complet de l'éligibilité
- Statistiques annuelles par service et sous-direction
- Calcul automatique basé sur les jours consommés
- Export des listes d'éligibles

### Gestion Administrative
- Sous-directions et services
- Utilisateurs avec gestion des rôles (ADMIN, MANAGER_RH, EMPLOYE_RH)
- Statistiques globales sur le dashboard

## 🛠️ Stack Technique

- **Framework**: React 18+ avec TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v3
- **UI Components**: Shadcn/ui
- **State Management**: Context API (Auth)
- **API Client**: Axios
- **Date Management**: date-fns
- **Forms**: React Hook Form + Yup
- **Build Tool**: Vite

## 📋 Prérequis

- Node.js 18+ et npm
- Backend API Spring Boot (http://localhost:8080)

## 🎨 Design System

### Palette de Couleurs
- **Primary**: Bleu professionnel (#1e40af) - Confiance et autorité
- **Success**: Vert émeraude (#10b981) - Actions positives
- **Warning**: Ambre (#f59e0b) - Alertes
- **Destructive**: Rouge (#ef4444) - Actions destructrices

### Composants Personnalisés
- Buttons avec variantes (default, success, destructive, outline)
- Cards avec ombres élégantes
- Tables responsives avec hover states
- Badges de statut colorés
- Sidebar de navigation

## 🔐 Authentification

L'application utilise JWT pour l'authentification:
- Token stocké dans localStorage
- Interceptor Axios pour ajouter le token aux requêtes
- Routes protégées avec vérification du rôle
- Redirection automatique si non authentifié

### Rôles Utilisateur
- **ADMIN**: Accès complet + gestion des utilisateurs
- **MANAGER_RH**: Gestion complète sauf utilisateurs
- **EMPLOYE_RH**: Création de demandes et lecture seule

## 🚀 Installation

```bash
# Cloner le projet
git clone <repository-url>

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour production
npm run build
```

## ⚙️ Configuration

Créer un fichier `.env` à la racine:

```env
VITE_API_URL=http://localhost:8080
```

## 📱 Responsive Design

L'application est entièrement responsive:
- Mobile first approach
- Sidebar collapsible sur mobile
- Tables scrollables horizontalement
- Modals full-screen sur petits écrans

## 🎯 Architecture du Projet

```
src/
├── api/              # Services API (axios)
├── components/       
│   ├── layout/       # Sidebar, Header
│   ├── ui/           # Shadcn components
│   └── ProtectedRoute.tsx
├── context/          # AuthContext
├── pages/            # Pages principales
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Employes.tsx
│   ├── DemandesConges.tsx
│   ├── SuiviICA.tsx
│   ├── SousDirections.tsx
│   └── Services.tsx
├── hooks/            # Custom hooks
├── lib/              # Utilities
└── App.tsx           # Configuration routing
```

## 🔧 API Endpoints Utilisés

- `POST /api/auth/login` - Authentification
- `GET /api/dashboard/statistics` - Statistiques dashboard
- `GET /api/employes` - Liste employés
- `GET /api/demandes-conges` - Liste demandes
- `GET /api/ica/suivi` - Suivi ICA
- `GET /api/sous-directions` - Sous-directions
- `GET /api/services` - Services

## 📄 License

© 2025 CNAS Constantine - Tous droits réservés

## 👥 Support

Pour toute question, contactez le service informatique CNAS Constantine.
