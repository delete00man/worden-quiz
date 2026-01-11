# WORDEN QUIZ - Déploiement sur Vercel

## 📋 Prérequis

1. Compte GitHub
2. Compte Vercel (gratuit)
3. Compte Supabase (gratuit)

---

## 🗄️ Étape 1 : Créer une base de données Supabase

1. Va sur [supabase.com](https://supabase.com) et crée un compte
2. Clique sur **New Project**
3. Configuration :
   - **Nom** : `worden-quiz`
   - **Région** : `eu-central-1` (la plus proche)
   - **Mot de passe** : note-le bien !
4. Clique sur **Create Project** (attends ~2 min)

### Récupérer l'URL de connexion

1. Dans Supabase, va dans **Settings** → **Database**
2. Scroll jusqu'à **Connection string** → onglet **URI**
3. Copie l'URL et remplace `[YOUR-PASSWORD]` par ton mot de passe :

```
postgresql://postgres.[ref]:[MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## 📤 Étape 2 : Pousser le code sur GitHub

```bash
cd worden-quiz
git init
git add .
git commit -m "Initial commit - WORDEN QUIZ"
```

Crée un repo sur GitHub, puis :

```bash
git remote add origin https://github.com/TON_USERNAME/worden-quiz.git
git branch -M main
git push -u origin main
```

---

## 🚀 Étape 3 : Déployer sur Vercel

1. Va sur [vercel.com](https://vercel.com) et connecte-toi avec GitHub
2. Clique sur **Add New** → **Project**
3. Sélectionne ton repo `worden-quiz`
4. Dans **Environment Variables**, ajoute :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `NEXTAUTH_SECRET` | (génère avec : `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://ton-app.vercel.app` |

5. Clique sur **Deploy**

---

## 🏗️ Étape 4 : Initialiser la base de données

Après le déploiement, exécute ces commandes **en local** :

```bash
# Définir les variables d'environnement (remplace par tes valeurs)
export DATABASE_URL="postgresql://postgres.xxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Pousser le schéma
npx prisma db push

# Créer l'admin et les données de démo
npx tsx prisma/seed.ts
```

---

## ✅ Terminé !

Ton app est en ligne ! Connecte-toi avec :

| Email | Mot de passe |
|-------|--------------|
| `arthushaulot@gmail.com` | `admin123` |

> ⚠️ **Change ton mot de passe admin** après la première connexion !

---

## 💰 Coûts (tout gratuit)

| Service | Limite gratuite |
|---------|-----------------|
| **Vercel** | 100GB bandwidth/mois |
| **Supabase** | 500MB database, 50k requêtes/mois |

Pour ~20 étudiants, tu resteras largement dans les limites gratuites.

---

## 🔧 Maintenance

### Ajouter des niveaux
1. Connecte-toi en admin
2. Va dans **Admin** → **Créer un niveau**
3. Utilise l'import PDF ou le texte en masse

### Mettre à jour le code
```bash
git add .
git commit -m "Update"
git push
```
Vercel redéploie automatiquement !
