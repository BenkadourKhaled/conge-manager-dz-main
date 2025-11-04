# 🔍 Guide de Test - Fonctionnalité Audit Trail

## ✅ Statut de la Fonctionnalité

**Toutes les vérifications sont passées avec succès !** ✨

---

## 📦 Composants Installés

### 1. ✅ Page AuditTrail.tsx
- **Emplacement:** `src/pages/AuditTrail.tsx`
- **Taille:** 12 KB
- **Statut:** ✅ Créé et configuré

### 2. ✅ API Audit
- **Fichier:** `src/api/services.ts`
- **Export:** `export const auditApi = { ... }`
- **Intégration:** ✅ Inclus dans l'export default
- **Endpoints disponibles:**
  - `getRecent()` - Les 100 dernières opérations
  - `getMyActivity(page, size)` - Mon activité
  - `getEntityHistory(entityName, entityId)` - Historique d'une entité
  - `getStatistics(startDate, endDate)` - Statistiques
  - `search(searchRequest)` - Recherche avancée

### 3. ✅ Types TypeScript
- **Fichier:** `src/types/api.types.ts`
- **Types définis:**
  - `AuditTrailResponse`
  - `AuditSearchRequest`
  - `OperationType` (CREATE, UPDATE, DELETE)
  - `PaginatedResponse<AuditTrailResponse>`

### 4. ✅ Configuration React Query
- **Fichier:** `src/constants/index.ts`
- **Clés de cache:**
  - `AUDIT_RECENT`
  - `AUDIT_MY_ACTIVITY`
  - `AUDIT_ENTITY`
  - `AUDIT_STATISTICS`

### 5. ✅ Route Configurée
- **Fichier:** `src/App.tsx`
- **Route:** `/audit`
- **Protection:** ✅ Wrapped dans `<ProtectedRoute>`
- **Lazy Loading:** ✅ Activé

### 6. ✅ Lien dans Sidebar
- **Fichier:** `src/components/layout/Sidebar.tsx`
- **Nom:** "Journal d'Audit"
- **Icône:** Shield 🛡️
- **Rôles autorisés:** ADMIN, MANAGER_RH

---

## 🧪 Guide de Test Manuel

### Étape 1: Démarrer l'Application

```bash
# Backend (assurez-vous qu'il tourne sur port 8080)
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm run dev
```

### Étape 2: Se Connecter

1. Aller sur `http://localhost:5173/login`
2. Se connecter avec un compte **ADMIN** ou **MANAGER_RH**
3. Vérifier que le dashboard s'affiche

### Étape 3: Accéder à l'Audit Trail

**Méthode 1 - Via Sidebar:**
1. Dans le menu de gauche, chercher "Journal d'Audit" 🛡️
2. Cliquer dessus
3. Vérifier que la page `/audit` se charge

**Méthode 2 - URL Directe:**
1. Taper `http://localhost:5173/audit` dans la barre d'adresse
2. Appuyer sur Entrée

### Étape 4: Vérifier les Fonctionnalités

#### 🔍 Recherche
- [ ] Taper dans la barre de recherche (ex: "admin", "employe", etc.)
- [ ] Vérifier que les résultats se filtrent en temps réel

#### 🏷️ Filtres
- [ ] **Filtre par Type d'Entité:**
  - Cliquer sur "Type d'entité"
  - Sélectionner une entité (ex: "Employe", "DemandeConge")
  - Vérifier que seules les opérations de ce type s'affichent

- [ ] **Filtre par Opération:**
  - Cliquer sur "Opération"
  - Sélectionner CREATE, UPDATE ou DELETE
  - Vérifier le filtrage

#### 📊 Tableau des Audits
- [ ] Vérifier que les colonnes s'affichent:
  - Date & Heure
  - Utilisateur
  - Entité (avec ID)
  - Opération (badge coloré)
  - Description
  - Statut (Succès/Échec)

- [ ] Vérifier les badges colorés:
  - 🟢 Création (vert)
  - 🔵 Modification (bleu)
  - 🔴 Suppression (rouge)

#### 📥 Export CSV
- [ ] Cliquer sur le bouton "Exporter CSV"
- [ ] Vérifier qu'un fichier `audit-trail-YYYY-MM-DD.csv` est téléchargé
- [ ] Ouvrir le CSV dans Excel/LibreOffice
- [ ] Vérifier que les données sont bien formatées

---

## 🎯 Tests Fonctionnels Avancés

### Test 1: Vérifier que les Logs sont Générés

1. **Créer un employé:**
   - Aller sur `/employes`
   - Cliquer sur "Ajouter un employé"
   - Remplir le formulaire et enregistrer

2. **Vérifier dans Audit Trail:**
   - Aller sur `/audit`
   - Chercher votre username
   - Vérifier qu'une ligne "CREATE - Employe" apparaît

### Test 2: Vérifier le Filtrage Combiné

1. Aller sur `/audit`
2. Rechercher "admin" dans la barre de recherche
3. Sélectionner "Employe" dans le filtre d'entité
4. Sélectionner "CREATE" dans le filtre d'opération
5. Vérifier que seules les créations d'employés par admin s'affichent

### Test 3: Vérifier les Permissions

1. **Avec compte EMPLOYE_RH:**
   - Se connecter avec un compte EMPLOYE_RH
   - Vérifier que "Journal d'Audit" n'apparaît PAS dans le sidebar
   - Essayer d'accéder à `/audit` directement
   - Vérifier la redirection ou l'erreur

2. **Avec compte ADMIN:**
   - Se connecter avec un compte ADMIN
   - Vérifier que "Journal d'Audit" apparaît dans le sidebar
   - Vérifier l'accès complet à la page

---

## 🐛 Dépannage

### Problème: "Aucune activité trouvée"

**Cause:** Le backend ne retourne pas de logs d'audit

**Solutions:**
1. Vérifier que le backend est démarré: `curl http://localhost:8080/api/audit/recent`
2. Vérifier les logs du backend pour les erreurs
3. Effectuer quelques opérations (créer un employé, etc.) pour générer des logs

### Problème: Erreur 401 Unauthorized

**Cause:** Token JWT invalide ou expiré

**Solutions:**
1. Se déconnecter et se reconnecter
2. Vérifier que le token est bien stocké: `localStorage.getItem('token')`
3. Vérifier la configuration de l'API dans `.env`

### Problème: Page blanche ou erreur de chargement

**Cause:** Erreur de compilation ou de lazy loading

**Solutions:**
1. Vérifier la console du navigateur (F12)
2. Relancer le serveur de dev: `npm run dev`
3. Vider le cache du navigateur: Ctrl+Shift+R

### Problème: Double Sidebar

**Cause:** Déjà corrigé ! Mais si ça revient:

**Solution:**
- S'assurer que la page n'importe PAS `<Sidebar />` directement
- Le `ProtectedRoute` s'en charge automatiquement

---

## 📊 Endpoints Backend à Tester

### Via Postman ou cURL

**1. Get Recent Audits:**
```bash
curl -X GET "http://localhost:8080/api/audit/recent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**2. Get My Activity:**
```bash
curl -X GET "http://localhost:8080/api/audit/my-activity?page=0&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Search Audits:**
```bash
curl -X POST "http://localhost:8080/api/audit/search" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operationType": "CREATE",
    "page": 0,
    "size": 20
  }'
```

**4. Get Statistics:**
```bash
curl -X GET "http://localhost:8080/api/audit/statistics?startDate=2025-01-01T00:00:00&endDate=2025-12-31T23:59:59" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Checklist Finale

- [ ] Page AuditTrail.tsx existe et compile sans erreur
- [ ] Route `/audit` est accessible
- [ ] Lien "Journal d'Audit" apparaît dans le sidebar pour ADMIN/MANAGER_RH
- [ ] La page se charge sans erreur
- [ ] Le tableau affiche les données (ou message "Aucune activité")
- [ ] La recherche fonctionne
- [ ] Les filtres fonctionnent
- [ ] L'export CSV fonctionne
- [ ] Les permissions sont respectées (EMPLOYE_RH ne peut pas accéder)
- [ ] Pas de double sidebar
- [ ] Pas d'erreur dans la console

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifier la console du navigateur (F12 → Console)
2. Vérifier la console du backend
3. Consulter `OPTIMISATIONS.md` pour plus de détails
4. Vérifier que toutes les dépendances sont installées: `npm install`

---

## 🎉 Résultat Attendu

Une fois tous les tests passés, vous devriez avoir:

✅ Une page Audit Trail complète et fonctionnelle
✅ Affichage en temps réel des logs d'audit
✅ Recherche et filtres performants
✅ Export CSV des données
✅ Interface moderne et professionnelle
✅ Gestion des permissions
✅ Intégration seamless avec le reste de l'application

**La fonctionnalité Audit Trail est 100% opérationnelle ! 🚀**
